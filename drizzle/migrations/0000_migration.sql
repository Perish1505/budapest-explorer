
create type public.app_role as enum ('admin','user');
create type public.tour_type as enum ('walking','cycling');
create type public.booking_status as enum ('pending','confirmed','cancelled','completed','rejected');
create type public.payment_status as enum ('unpaid','pending_payment','paid','refunded','failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  preferred_language text default 'English',
  newsletter boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id or public.has_role(auth.uid(),'admin'));
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id or public.has_role(auth.uid(),'admin')) with check (auth.uid() = id or public.has_role(auth.uid(),'admin'));
create policy "own roles read" on public.user_roles for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

-- prevent non-admins from changing is_active/email on their own profile
create or replace function public.protect_profile_fields() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then
    new.is_active := old.is_active;
    new.email := old.email;
  end if;
  return new;
end $$;
create trigger protect_profile_fields before update on public.profiles for each row execute function public.protect_profile_fields();

-- new user: profile + user role; admin role for the designated email only once the email is verified
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, newsletter)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''), coalesce((new.raw_user_meta_data->>'newsletter')::boolean,false));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  if new.email_confirmed_at is not null and lower(new.email) = 'azim-08@mail.ru' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.handle_user_confirmed() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null and lower(new.email) = 'azim-08@mail.ru' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_auth_user_confirmed after update on auth.users for each row execute function public.handle_user_confirmed();

create table public.tours (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  type public.tour_type not null,
  short_description text not null default '',
  description text not null default '',
  highlights text[] not null default '{}',
  itinerary jsonb not null default '[]',
  duration_minutes int not null default 120,
  distance_km numeric,
  difficulty text not null default 'Easy',
  min_age int,
  languages text[] not null default '{English}',
  max_group_size int not null default 12,
  meeting_point text not null default '',
  meeting_address text not null default '',
  lat double precision,
  lng double precision,
  included text[] not null default '{}',
  excluded text[] not null default '{}',
  equipment text,
  safety_info text,
  price_adult numeric(10,2) not null,
  price_child numeric(10,2),
  image_url text,
  featured boolean not null default false,
  published boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.tours to anon, authenticated;
grant insert, update, delete on public.tours to authenticated;
grant all on public.tours to service_role;
alter table public.tours enable row level security;
create policy "published tours public" on public.tours for select to anon, authenticated using (published or public.has_role(auth.uid(),'admin'));
create policy "admin manage tours" on public.tours for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.tour_departures (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  starts_at timestamptz not null,
  capacity int not null check (capacity > 0),
  reserved int not null default 0 check (reserved >= 0),
  status text not null default 'open' check (status in ('open','closed','cancelled')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.tour_departures (tour_id, starts_at);
grant select on public.tour_departures to anon, authenticated;
grant insert, update, delete on public.tour_departures to authenticated;
grant all on public.tour_departures to service_role;
alter table public.tour_departures enable row level security;
create policy "departures public" on public.tour_departures for select to anon, authenticated using (exists (select 1 from public.tours t where t.id = tour_id and (t.published or public.has_role(auth.uid(),'admin'))));
create policy "admin manage departures" on public.tour_departures for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid not null,
  tour_id uuid not null references public.tours(id) on delete restrict,
  departure_id uuid not null references public.tour_departures(id) on delete restrict,
  adults int not null,
  children int not null default 0,
  price_adult numeric(10,2) not null,
  price_child numeric(10,2),
  total numeric(10,2) not null,
  currency text not null default 'EUR',
  status public.booking_status not null default 'pending',
  payment_status public.payment_status not null default 'unpaid',
  customer_name text,
  customer_email text,
  notes text,
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.bookings (user_id);
grant select on public.bookings to authenticated;
grant all on public.bookings to service_role;
alter table public.bookings enable row level security;
create policy "own bookings read" on public.bookings for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours(id) on delete cascade,
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  user_id uuid not null,
  author_name text,
  rating int not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 2000),
  approved boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.reviews to anon, authenticated;
grant insert, update, delete on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "approved reviews public" on public.reviews for select to anon, authenticated using (approved or auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "review completed own booking" on public.reviews for insert to authenticated with check (
  auth.uid() = user_id and exists (
    select 1 from public.bookings b join public.tour_departures d on d.id = b.departure_id
    where b.id = booking_id and b.user_id = auth.uid() and b.tour_id = reviews.tour_id
      and (b.status = 'completed' or (b.status = 'confirmed' and d.starts_at < now()))
  ));
create policy "admin moderate reviews" on public.reviews for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin delete reviews" on public.reviews for delete to authenticated using (public.has_role(auth.uid(),'admin') or auth.uid() = user_id);

create table public.favorites (
  user_id uuid not null,
  tour_id uuid not null references public.tours(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tour_id)
);
grant select, insert, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;
alter table public.favorites enable row level security;
create policy "own favorites" on public.favorites for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 255),
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now()
);
grant insert on public.contact_messages to anon, authenticated;
grant select, delete on public.contact_messages to authenticated;
grant all on public.contact_messages to service_role;
alter table public.contact_messages enable row level security;
create policy "anyone can send" on public.contact_messages for insert to anon, authenticated with check (true);
create policy "admin read messages" on public.contact_messages for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin delete messages" on public.contact_messages for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) between 3 and 255),
  consent boolean not null check (consent),
  created_at timestamptz not null default now()
);
grant insert on public.newsletter_subscribers to anon, authenticated;
grant select on public.newsletter_subscribers to authenticated;
grant all on public.newsletter_subscribers to service_role;
alter table public.newsletter_subscribers enable row level security;
create policy "anyone subscribe" on public.newsletter_subscribers for insert to anon, authenticated with check (consent);
create policy "admin read subs" on public.newsletter_subscribers for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- Atomic booking
create or replace function public.create_booking(_departure_id uuid, _adults int, _children int, _notes text default null)
returns table (booking_id uuid, reference text) language plpgsql security definer set search_path = public as $$
declare
  d public.tour_departures%rowtype;
  t public.tours%rowtype;
  p public.profiles%rowtype;
  n int;
  ref text;
  tot numeric;
  bid uuid;
begin
  if auth.uid() is null then raise exception 'Please sign in to book'; end if;
  select * into p from public.profiles where id = auth.uid();
  if p.id is null or not p.is_active then raise exception 'Your account is not active'; end if;
  if _adults is null or _adults < 1 then raise exception 'At least one adult is required'; end if;
  if _children is null or _children < 0 then raise exception 'Invalid number of children'; end if;
  if _notes is not null and char_length(_notes) > 500 then raise exception 'Notes too long'; end if;
  select * into d from public.tour_departures where id = _departure_id for update;
  if d.id is null then raise exception 'Departure not found'; end if;
  select * into t from public.tours where id = d.tour_id;
  if not t.published then raise exception 'Tour is not available'; end if;
  if d.status <> 'open' then raise exception 'This departure is not open for booking'; end if;
  if d.starts_at <= now() then raise exception 'This departure has already started'; end if;
  if _children > 0 and t.price_child is null then raise exception 'This tour does not offer child tickets'; end if;
  n := _adults + _children;
  if n > t.max_group_size then raise exception 'Maximum group size is %', t.max_group_size; end if;
  if d.reserved + n > d.capacity then raise exception 'Only % places left', d.capacity - d.reserved; end if;
  tot := t.price_adult * _adults + coalesce(t.price_child,0) * _children;
  loop
    ref := 'BE-' || upper(substr(md5(random()::text || clock_timestamp()::text),1,8));
    exit when not exists (select 1 from public.bookings b where b.reference = ref);
  end loop;
  insert into public.bookings (reference, user_id, tour_id, departure_id, adults, children, price_adult, price_child, total, customer_name, customer_email, notes, status)
  values (ref, auth.uid(), t.id, d.id, _adults, _children, t.price_adult, t.price_child, tot, p.full_name, p.email, nullif(trim(_notes),''), 'confirmed')
  returning id into bid;
  update public.tour_departures set reserved = reserved + n where id = d.id;
  return query select bid, ref;
end $$;

-- cancellation: owners up to 24h before departure; admins any time
create or replace function public.cancel_booking(_booking_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare b public.bookings%rowtype; d public.tour_departures%rowtype; is_admin boolean;
begin
  is_admin := public.has_role(auth.uid(),'admin');
  select * into b from public.bookings where id = _booking_id for update;
  if b.id is null or (b.user_id <> auth.uid() and not is_admin) then raise exception 'Booking not found'; end if;
  if b.status not in ('pending','confirmed') then raise exception 'This booking cannot be cancelled'; end if;
  select * into d from public.tour_departures where id = b.departure_id for update;
  if not is_admin and d.starts_at - now() < interval '24 hours' then
    raise exception 'Bookings can only be cancelled at least 24 hours before departure';
  end if;
  update public.bookings set status = 'cancelled', cancelled_at = now(),
    payment_status = case when payment_status = 'paid' then 'refunded'::public.payment_status else payment_status end
  where id = b.id;
  update public.tour_departures set reserved = greatest(reserved - (b.adults + b.children), 0) where id = d.id;
end $$;

create or replace function public.admin_set_booking_status(_booking_id uuid, _status public.booking_status)
returns void language plpgsql security definer set search_path = public as $$
declare b public.bookings%rowtype;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  select * into b from public.bookings where id = _booking_id for update;
  if b.id is null then raise exception 'Booking not found'; end if;
  if b.status in ('cancelled','rejected') then raise exception 'Closed bookings cannot be changed'; end if;
  if _status in ('cancelled','rejected') then
    update public.bookings set status = _status, cancelled_at = now() where id = b.id;
    update public.tour_departures set reserved = greatest(reserved - (b.adults + b.children), 0) where id = b.departure_id;
  else
    update public.bookings set status = _status where id = b.id;
  end if;
end $$;

revoke execute on function public.create_booking(uuid,int,int,text) from anon, public;
revoke execute on function public.cancel_booking(uuid) from anon, public;
revoke execute on function public.admin_set_booking_status(uuid, public.booking_status) from anon, public;
grant execute on function public.create_booking(uuid,int,int,text) to authenticated;
grant execute on function public.cancel_booking(uuid) to authenticated;
grant execute on function public.admin_set_booking_status(uuid, public.booking_status) to authenticated;

-- Demo seed
insert into public.tours (slug,title,type,short_description,description,highlights,itinerary,duration_minutes,distance_km,difficulty,min_age,languages,max_group_size,meeting_point,meeting_address,lat,lng,included,excluded,equipment,safety_info,price_adult,price_child,image_url,featured,published,is_demo) values
('budapest-highlights-walk','Budapest Highlights Walking Tour','walking','The essential first-day walk through Pest''s grand boulevards, riverbanks and landmarks.','A relaxed introduction to Budapest''s centre. We stroll from Vörösmarty Square along the Danube promenade to the Parliament, pass St. Stephen''s Basilica and end with views of the Chain Bridge, sharing the stories behind the city''s two halves.',array['Danube Promenade','Hungarian Parliament (exterior)','St. Stephen''s Basilica (exterior)','Chain Bridge views'],'[{"title":"Vörösmarty Square","description":"Meet your guide and get oriented."},{"title":"Danube Promenade","description":"Riverside views across to Buda Castle."},{"title":"Shoes on the Danube Bank","description":"A quiet moment at the memorial."},{"title":"Parliament","description":"Architecture and history of Kossuth Square."},{"title":"St. Stephen''s Basilica","description":"Finish in the square beneath the dome."}]',150,null,'Easy',null,array['English','German'],14,'Vörösmarty Square, by the Gerbeaud café','Vörösmarty tér 7, 1051 Budapest',47.4963,19.0505,array['Licensed local guide','Small group','Map of the city'],array['Food and drinks','Entrance tickets'],null,'Comfortable shoes recommended. Route is flat and on paved streets.',29,15,'/images/tour-highlights.jpg',true,true,true),
('buda-castle-district-walk','Historic Buda Castle and Castle District Walk','walking','Cobbled lanes, royal courtyards and the best panoramas over the Danube.','Climb to Castle Hill and wander the medieval Castle District: Matthias Church, Fisherman''s Bastion, the Royal Palace courtyards and hidden viewpoints. Includes some steep stairs.',array['Fisherman''s Bastion','Matthias Church (exterior)','Buda Castle courtyards','Panoramic viewpoints'],'[{"title":"Clark Ádám Square","description":"Meet at the foot of the hill."},{"title":"Castle Hill climb","description":"Walk up through the castle gardens."},{"title":"Royal Palace","description":"Courtyards and the Danube terrace."},{"title":"Matthias Church & Fisherman''s Bastion","description":"Gothic church and fairytale towers."}]',180,null,'Moderate',null,array['English','Spanish'],14,'Clark Ádám Square, by the Zero Kilometre Stone','Clark Ádám tér, 1013 Budapest',47.4980,19.0398,array['Licensed local guide','Small group'],array['Funicular ticket','Museum entries'],null,'Includes steep stairs and cobblestones.',35,18,'/images/tour-castle.jpg',true,true,true),
('jewish-quarter-street-art','Jewish Quarter and Street Art Walk','walking','Synagogues, courtyards, ruin bars and the murals of District VII.','Explore Budapest''s historic Jewish Quarter: the Dohány Street Synagogue exterior, the old ghetto area, passage courtyards, ruin bars by day and the colourful street art of Erzsébetváros.',array['Dohány Street Synagogue (exterior)','Gozsdu Courtyard','Street art murals','Ruin bar culture'],'[{"title":"Dohány Street Synagogue","description":"History of Europe''s largest synagogue."},{"title":"Kazinczy Street","description":"Orthodox synagogue and old quarter."},{"title":"Murals","description":"Contemporary street art."},{"title":"Gozsdu Courtyard","description":"Finish among the passages."}]',120,null,'Easy',null,array['English','Hebrew'],14,'Outside Dohány Street Synagogue main entrance','Dohány utca 2, 1074 Budapest',47.4960,19.0607,array['Licensed local guide'],array['Synagogue entrance ticket','Drinks'],null,'Respectful dress recommended near religious sites.',27,14,'/images/tour-jewish.jpg',false,true,true),
('hidden-gems-local-stories','Budapest Hidden Gems and Local Stories','walking','Quiet squares, passages and cafés most visitors walk past.','A slower walk through the Palace District and inner Pest: secret courtyards, old coffee houses, market halls and the local stories behind them.',array['Palace District','Hidden courtyards','Central Market Hall','Local cafés'],'[{"title":"Kálvin Square","description":"Start in the Palace District."},{"title":"Courtyards","description":"Passages and residential palaces."},{"title":"Central Market Hall","description":"End at the great market."}]',120,null,'Easy',null,array['English'],10,'Kálvin Square, by the Reformed church','Kálvin tér 7, 1091 Budapest',47.4895,19.0614,array['Licensed local guide','Small group (max 10)'],array['Food and drinks'],null,'Flat, paved route.',25,12,'/images/tour-hidden.jpg',false,true,true),
('danube-cycling-adventure','Danube River Cycling Adventure','cycling','Ride both banks of the Danube and pass the city''s great landmarks by bike.','A guided bike ride along the Danube on both the Pest and Buda sides, crossing bridges and stopping for photos at the Parliament, Chain Bridge, Gellért Hill and Margaret Island.',array['Parliament riverside','Chain Bridge','Buda embankment','Margaret Bridge'],'[{"title":"Bike fitting","description":"Helmet and bike set-up."},{"title":"Pest embankment","description":"Ride north past the Parliament."},{"title":"Cross to Buda","description":"Riverside views of Pest."},{"title":"Gellért Hill foot","description":"Photo stop and return."}]',180,14,'Easy to moderate',10,array['English','German'],12,'Budapest Explorer bike base, Deák Square','Deák Ferenc tér, 1052 Budapest',47.4977,19.0547,array['Bike and helmet','Licensed guide','Bottled water'],array['Food','Gratuities'],'City bike with gears, helmet in all sizes, child seats on request.','Must be able to ride confidently in traffic. Helmets mandatory for under-18s and recommended for all.',39,25,'/images/tour-danube.jpg',true,true,true),
('margaret-island-parks-bike','Margaret Island and City Parks Bike Tour','cycling','Relaxed cycling through car-free Margaret Island and City Park.','Pedal at an easy pace through Margaret Island''s gardens and fountain, then on to Heroes'' Square and City Park, with plenty of stops.',array['Margaret Island','Musical Fountain','Heroes'' Square','City Park & Vajdahunyad Castle'],'[{"title":"Margaret Bridge","description":"Ride onto the island."},{"title":"Island loop","description":"Gardens, water tower and fountain."},{"title":"Heroes'' Square","description":"Millennium monument."},{"title":"City Park","description":"Castle and lake."}]',150,12,'Easy',8,array['English'],12,'Budapest Explorer bike base, Deák Square','Deák Ferenc tér, 1052 Budapest',47.4977,19.0547,array['Bike and helmet','Licensed guide'],array['Food and drinks'],'City bikes, kids'' bikes and child seats available.','Mostly on bike paths; short stretches on city streets.',35,22,'/images/tour-margaret.jpg',true,true,true),
('buda-hills-viewpoints-bike','Buda Hills and Scenic Viewpoints Bike Tour','cycling','A tougher ride into the green Buda Hills for big views.','For confident riders: climb into the Buda Hills on quiet roads and forest paths, with viewpoints over the whole city and a fast descent back to the river.',array['Buda Hills forests','Panoramic viewpoints','Quiet residential villas'],'[{"title":"Batthyány Square","description":"Bike fitting and briefing."},{"title":"Climb","description":"Steady ascent into the hills."},{"title":"Viewpoint","description":"Rest and photos."},{"title":"Descent","description":"Back to the river."}]',210,22,'Moderate to challenging',14,array['English'],8,'Batthyány Square, by the metro exit','Batthyány tér, 1011 Budapest',47.5068,19.0389,array['E-bike or trekking bike','Helmet','Guide','Snack'],array['Lunch'],'Trekking bikes; e-bikes available.','Requires good fitness and cycling experience. Steep climbs and descents.',55,null,'/images/tour-hills.jpg',false,true,true),
('sunset-cycling-tour','Sunset Cycling Tour of Budapest','cycling','Golden-hour ride ending with the city lights along the Danube.','An evening bike ride timed for sunset: riverside paths, illuminated bridges and the Parliament as the lights come on.',array['Golden hour on the Danube','Illuminated Parliament','Chain Bridge at dusk'],'[{"title":"Meet & fit","description":"Bikes with lights."},{"title":"Riverside ride","description":"Sunset over Buda."},{"title":"Lights on","description":"Parliament and bridges illuminated."}]',150,11,'Easy to moderate',12,array['English'],12,'Budapest Explorer bike base, Deák Square','Deák Ferenc tér, 1052 Budapest',47.4977,19.0547,array['Bike with lights','Helmet','Hi-vis vest','Guide'],array['Food and drinks'],'Bikes fitted with front and rear lights.','Evening ride; reflective vests provided.',42,28,'/images/tour-sunset.jpg',true,true,true);

insert into public.tour_departures (tour_id, starts_at, capacity, is_demo)
select t.id,
  ((current_date + g)::timestamp + (case when t.slug = 'sunset-cycling-tour' then time '18:30' when t.type='cycling' then time '10:00' else time '10:30' end)) at time zone 'Europe/Budapest',
  t.max_group_size, true
from public.tours t cross join generate_series(1, 30) g
where (g + length(t.slug)) % 2 = 0 or t.featured;

insert into public.tour_departures (tour_id, starts_at, capacity, is_demo)
select t.id, ((current_date + g)::timestamp + time '15:00') at time zone 'Europe/Budapest', t.max_group_size, true
from public.tours t cross join generate_series(1, 30, 3) g
where t.type = 'walking';

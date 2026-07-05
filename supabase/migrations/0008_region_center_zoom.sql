-- Clicking a region chip (or matching one via search) needs somewhere to
-- fly the map to. Regions had no coordinates of their own - only Places
-- do - so there was nothing to zoom to.

alter table regions add column center_lat double precision;
alter table regions add column center_lng double precision;
alter table regions add column default_zoom double precision not null default 9;

update regions set center_lat = 32.2265, center_lng = 78.0569, default_zoom = 9.5 where slug = 'spiti';
update regions set center_lat = 34.1526, center_lng = 77.5771, default_zoom = 9 where slug = 'ladakh';
update regions set center_lat = 33.4652, center_lng = 76.8887, default_zoom = 9.5 where slug = 'zanskar';
update regions set center_lat = 27.3389, center_lng = 88.6065, default_zoom = 9 where slug = 'sikkim';
-- No-op until 0007 (Dharamkot) has been run - harmless if it hasn't yet.
update regions set center_lat = 32.2437, center_lng = 76.3197, default_zoom = 12 where slug = 'dharamkot';

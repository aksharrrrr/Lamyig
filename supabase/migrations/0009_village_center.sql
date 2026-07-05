-- Villages had no coordinates of their own either (same gap as regions in
-- 0008) - needed so search can fly to a village, not just a region.

alter table villages add column center_lat double precision;
alter table villages add column center_lng double precision;

update villages set center_lat = 32.2265, center_lng = 78.0569 where slug = 'kaza';
update villages set center_lat = 32.4667, center_lng = 77.9333 where slug = 'losar';
update villages set center_lat = 32.2, center_lng = 78.05 where slug = 'shego';
update villages set center_lat = 32.2833, center_lng = 78.5833 where slug = 'gue';
update villages set center_lat = 32.0952, center_lng = 78.3576 where slug = 'tabo';
update villages set center_lat = 32.1975, center_lng = 78.1975 where slug = 'dhankar';
update villages set center_lat = 34.1526, center_lng = 77.5771 where slug = 'leh';
update villages set center_lat = 34.5333, center_lng = 77.5833 where slug = 'nubra';
update villages set center_lat = 33.7526, center_lng = 78.4425 where slug = 'pangong';
update villages set center_lat = 34.2333, center_lng = 77.2667 where slug = 'alchi';
update villages set center_lat = 33.4652, center_lng = 76.8887 where slug = 'padum';
update villages set center_lat = 33.5333, center_lng = 76.8333 where slug = 'karsha';
update villages set center_lat = 33.6333, center_lng = 76.9167 where slug = 'zangla';
update villages set center_lat = 33.9333, center_lng = 76.4167 where slug = 'rangdum';
update villages set center_lat = 27.3389, center_lng = 88.6065 where slug = 'gangtok';
update villages set center_lat = 27.2167, center_lng = 88.2333 where slug = 'pelling';
update villages set center_lat = 27.7167, center_lng = 88.55 where slug = 'lachen';
update villages set center_lat = 27.8167, center_lng = 88.6833 where slug = 'yumthang';

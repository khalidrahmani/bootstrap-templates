CREATE TABLE areatype
(
  areatypeid SERIAL,
  name character varying(20) NOT NULL,
  CONSTRAINT pk_areatype PRIMARY KEY (areatypeid)
);

CREATE TABLE itemtype
(
  itemtypeid SERIAL,
  name character varying(20) NOT NULL,
  iconurl character varying(500) NOT NULL,
  CONSTRAINT pk_itemtype PRIMARY KEY (itemtypeid)
);

CREATE TABLE mediatype
(
  mediatypeid SERIAL,
  type character varying(20) NOT NULL,
  CONSTRAINT pk_mediatype PRIMARY KEY (mediatypeid)
);

CREATE TABLE taggeditem
(
  taggeditemid integer NOT NULL,
  itemid integer NOT NULL,
  createdutc timestamp(4) without time zone NOT NULL,
  CONSTRAINT pk_taggeditem PRIMARY KEY (taggeditemid, itemid)
);

CREATE TABLE area
(
  areaid SERIAL,  
  parentareaid integer,
  areatypeid integer NOT NULL,
  name text NOT NULL,
  description text,
  index integer,
  topleftxy character varying(9) NOT NULL,
  toprightxy character varying(9) NOT NULL,
  bottomrightxy character varying(9) NOT NULL,
  bottomleftxy character varying(9) NOT NULL,
  backgroundurl character varying(1000),
  beaconudid character varying(100),
  abbreviation character varying(50),
  CONSTRAINT pk_area PRIMARY KEY (areaid),
  CONSTRAINT fk_area_has_parentarea FOREIGN KEY (areaid)
      REFERENCES area (areaid) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT fk_areatype_has_area FOREIGN KEY (areatypeid)
      REFERENCES areatype (areatypeid) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE item
(
  itemid SERIAL,
  sourceid character varying(100) NOT NULL,
  areaid integer,
  itemtypeid integer NOT NULL,
  title text NOT NULL,
  alternativetitle character varying(200),
  description text,
  viewcount integer NOT NULL,
  sourceurl character varying(1000),
  coordinatexy character varying(9) NOT NULL,
  labelalignment character varying(15) NOT NULL,
  magazineindex integer,
  staffpickindex integer,
  createdutc timestamp(4) without time zone NOT NULL,
  deletedutc timestamp(4) without time zone,
  sourcecreatedutc timestamp(4) without time zone NOT NULL,
  CONSTRAINT pk_item PRIMARY KEY (itemid),
  CONSTRAINT fk_area_has_item FOREIGN KEY (areaid)
      REFERENCES area (areaid) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT fk_itemtype_has_item FOREIGN KEY (itemtypeid)
      REFERENCES itemtype (itemtypeid) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE media
(
  mediaid SERIAL,
  itemid integer NOT NULL,
  mediatypeid integer NOT NULL,
  mediaurl character varying(1000) NOT NULL,
  CONSTRAINT pk_media PRIMARY KEY (mediaid),
  CONSTRAINT fk_item_has_media FOREIGN KEY (itemid)
      REFERENCES item (itemid) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT fk_mediatype_has_media FOREIGN KEY (mediatypeid)
      REFERENCES mediatype (mediatypeid) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
);

ALTER TABLE item ADD CONSTRAINT uniqsourceid UNIQUE (sourceid);


INSERT INTO itemtype (itemtypeid, name, iconurl) VALUES (1, 'Brand', 'http://www.proximityinsight.com/wp-content/uploads/2016/06/Cartier-logo-c.png');
INSERT INTO itemtype (itemtypeid, name, iconurl) VALUES (2, 'Facebook', 'http://lcps.k12.nm.us/wp-content/themes/lcps/fd8ca743ed4abc6e6aaaa4622772fe96/lcps-share/images/facebook-small.png');
INSERT INTO itemtype (itemtypeid, name, iconurl) VALUES (3, 'Youtube', 'http://www.massageenvy.com/Common/Img/clinics/162/youtube_logo_small.png');
INSERT INTO itemtype (itemtypeid, name, iconurl) VALUES (4, 'Instagram', 'http://maddisonbeahome.com/wp-content/uploads/2016/01/logo-instagram.png');
INSERT INTO itemtype (itemtypeid, name, iconurl) VALUES (5, 'Twitter', 'http://www.seai.ie/images_upload/Schools/Post_Primary/One-Good-Idea-Project/icon-twitter.png');
INSERT INTO itemtype (itemtypeid, name, iconurl) VALUES (6, 'Pinterest', 'https://cdnjs.cloudflare.com/ajax/libs/webicons/2.0.0/webicons/webicon-pinterest-m.png');
INSERT INTO itemtype (itemtypeid, name, iconurl) VALUES (7, 'Tumblr', 'https://cdnjs.cloudflare.com/ajax/libs/webicons/2.0.0/webicons/webicon-tumblr-m.png');


INSERT INTO mediatype (mediatypeid, type) VALUES (1, 'Video');
INSERT INTO mediatype (mediatypeid, type) VALUES (2, 'Image');

/* heroku pg:psql   to login to heroku database */
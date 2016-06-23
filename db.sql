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
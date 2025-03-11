BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "films" (
	"id"	INTEGER,
	"title"	TEXT NOT NULL,
	"favorite"	INTEGER NOT NULL DEFAULT (0),
	"watchdate"	TEXT,
	"rating"	INTEGER,
	PRIMARY KEY("id" AUTOINCREMENT) 
);
INSERT INTO "films" ("title","favorite","watchdate","rating") VALUES ('Pulp Fiction',1,'2023-03-10',5);
INSERT INTO "films" ("title","favorite","watchdate","rating") VALUES ('21 Grams',1,'2023-03-17',4);
INSERT INTO "films" ("title","favorite","watchdate","rating") VALUES ('Star Wars',0,NULL,NULL);
INSERT INTO "films" ("title","favorite","watchdate","rating") VALUES ('Matrix',0,NULL,NULL);
INSERT INTO "films" ("title","favorite","watchdate","rating") VALUES ('Shrek',0,'2023-03-21',3);
INSERT INTO "films" ("title","favorite","watchdate","rating") VALUES ('The Dark Knight',1,'2025-03-11',5);
INSERT INTO "films" ("title","favorite","watchdate","rating") VALUES ('Fight Club',1,'2020-03-19',4);
INSERT INTO "films" ("title","favorite","watchdate","rating") VALUES ('Forest Gump',0,'2014-08-07',NULL);
INSERT INTO "films" ("title","favorite","watchdate","rating") VALUES ('The Shadowshank',0,NULL,2);
INSERT INTO "films" ("title","favorite","watchdate","rating") VALUES ('Inception',1,'2023-03-21',3);

COMMIT;

drop database if exists Book_sale;
select CONCAT("Creating database","   ","Book_sale!") as Process;
create database Book_sale;
use Book_sale;

CREATE TABLE users (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(10) NOT NULL,
    f_name VARCHAR(255) NOT NULL,
    l_name VARCHAR(255) NOT NULL,

    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE items (
    id INTEGER AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    price INTEGER NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    seller_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY(seller_id) REFERENCES users(id)
);


CREATE TABLE tags (
  id INTEGER AUTO_INCREMENT PRIMARY KEY,
  tag_name VARCHAR(255) UNIQUE

);

INSERT into tags (tag_name) values ("Physics"),("Chemistry"),("CSE"),("ISE"),("ECE"),("Civil"),("Mechanical"),("Industry"),("Others");

CREATE TABLE item_tags (
    item_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    FOREIGN KEY(item_id) REFERENCES items(id) ON DELETE CASCADE,
    FOREIGN KEY(tag_id) REFERENCES tags(id),
    PRIMARY KEY(item_id, tag_id)
);

CREATE TABLE REVIEW (user_id INTEGER NOT NULL,
                    book_id INTEGER NOT NULL,
                    RATING INTEGER NOT NULL,
                     FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
                     FOREIGN KEY(book_id) REFERENCES items(id) ON DELETE CASCADE,
                     PRIMARY KEY(user_id,book_id)
                     
                    );

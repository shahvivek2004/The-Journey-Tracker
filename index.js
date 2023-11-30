import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import { dirname } from "path";
import { fileURLToPath } from "url";

const op=dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "Vivek@2004",
  port: 5432,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let temp=await db.query("SELECT *FROM users");
let currentUserId = temp.rows[0].id;

async function checkVisisted(uid) {
  let queries=`SELECT country_code FROM visited_countries WHERE user_id=${uid}`;
 // console.log(queries);
  const result = await db.query(queries);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

app.get("/", async (req, res) => {
  const countries = await checkVisisted(currentUserId);
  const color=await db.query(`SELECT color FROM users WHERE id=${currentUserId}`);
  //console.log(countries);
  let tempo=await db.query("SELECT *FROM users");
  let users = tempo.rows;
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: color.rows[0].color,
  });
});


app.post("/add", async (req, res) => {
  //console.log(req.body);
  const input = req.body["country"];
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );


    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query("INSERT INTO visited_countries (country_code,user_id) VALUES ($1,$2)",[countryCode,currentUserId]);
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/user", async (req, res) => {

  //console.log(req.body);
  if(req.body.add){
    res.render("new.ejs");
  }

  else{
    currentUserId=req.body.user;
    let tempo=await db.query("SELECT *FROM users");
    let users = tempo.rows;
  
    const color=await db.query(`SELECT color FROM users WHERE id=${currentUserId}`);
    //console.log(color.rows[0].color);
  
    const countries = await checkVisisted(currentUserId);
    //console.log(countries);
  
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      color: color.rows[0].color,
    });
  }

});

app.post("/new", async (req, res) => {
  console.log(req.body);
  const uname=req.body.name;
  const ucolor=req.body.color;

  try
  {
    const idx=await db.query(`INSERT INTO users(name,color) VALUES ('${uname}','${ucolor}') RETURNING id`);
    currentUserId=idx.rows[0].id;
    let tempo=await db.query("SELECT *FROM users");
    let users = tempo.rows;
    //console.log(currentUserId);
    const countries=await checkVisisted(currentUserId);
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      users: users,
      color: ucolor,
    });
  } 

  catch (error) 
  {
    console.log(error);
  }
  
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

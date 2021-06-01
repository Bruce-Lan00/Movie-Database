/**
 * This demo code was written by Omar Flores & Wal Wal.
 * The usage of large portions of this code on tutorials or assignments is strictly prohibited.
 *
 * Movie data was obtained from the OMDb API
 */

//Create express app
const express = require('express');
let app = express();
const pug = require("pug");
const path = require('path');
const session = require("express-session");
const mongo = require("mongodb");
const { copyFileSync } = require('fs');
const { on } = require('events');
const port = 3000;



app.use(
  session({
    secret: "some secret key here",
    resave: true, // saves session after every request
    saveUninitialized: false, // stores the session if it hasn't been stored
  })
);

//Initialize server
app.set('views',path.join(__dirname,'views'));
app.use('/css',express.static('css'));
app.use(express.static("public"));


//View engine
app.set("view engine", "pug");

// MIDDLEWARE: When a form is sent, parse the form
app.use(express.urlencoded({ extended: true }));

// MIDDLEWARE: When 'Content-Type' is 'application/json', parse the JSON
app.use(express.json());

// MIDDLEWARE: Serve all the files, only if the user is authenticated
// auth -> next() -> express.static ...
app.use("/app", auth, express.static(path.join(__dirname, "private")));
//app.use(express.static("../private"))

//Set up the routes
app.post('/login',login);
app.get('/login',(req, res) => {
  res.statusCode = 200;
  if (req.session.loggedin) {
    res.status(200);
    res.redirect('/logout');
    return;
  }
  res.render('login.pug');
})

app.get('/logout',(req, res) => {
  res.statusCode = 200;
  res.render("logout");
})

app.post('/logout',(req, res) => {
  res.statusCode = 200;
  req.session.loggedin=false;
  res.redirect("/");
})


app.get('/signup',(req, res) => {
  res.statusCode = 200;
  if (req.session.loggedin) {
    res.status(200).send("Already logged in.");
    return;
  }
  res.render('signup.pug');
})
app.post('/signup',signup);

app.get('/', (req, res) => {
  res.statusCode = 200;
  res.render('home');
})

app.get('/ownprofille', auth,(req, res) => {
  let people;
  let watchedMovies = [];
  let genres = [];
  let tempArray = [];
  let favoriteGenres = [];
  let recommandMovies = [];
  let  review;
      
	  // find the logged in user from user collection
	  app.locals.db.collection("user").findOne({username :req.session.username}, function(err,result){
		if(err){
			res.status(401).send("Error");
			return;
		}
		res.status(200);
		const targetUser = result;
    req.session.followedUsers = result.followedUsers;
    req.session.watchlist = result.Watchlist;
    req.session.followedPeople =result.followedPeople
		
		//find current user's followedUsers from user collection
    app.locals.db.collection("user").find({username : {$in: targetUser.followedUsers}}).toArray(function(err,result){
		if(err){
			res.status(401).send("Error");
			return;
		}
		res.status(200);
		const followedUsers = result;
    for(i=0;i<req.session.followedUsers.length;i++){
    app.locals.db.collection("review").find({reviewer : req.session.followedUsers[i]}).toArray(function(err,result){
      if(err){
        res.status(401).send("Error");
        return;
      }
      res.status(200);
      review = result;
    })
    }
    app.locals.db.collection("people").find({name : {$in: targetUser.followedPeople}}).toArray(function(err,result){
      if(err){
        res.status(401).send("Error");
        return;
      }
      res.status(200);
      const followedPeople = result;

		
		// find user's watchlist from movie collection
		app.locals.db.collection("movie").find({
			Title : {$in: targetUser.Watchlist}
		}).toArray(function(err,result){
        
		if(err){
          res.status(401).send("Error");
          return;
        }
        res.status(200);

		watchedMovies = result;
		
		// get the genres from user's watchlist
		for( let i = 0; i < watchedMovies.length; i++){ 
			for (let j = 0; j < watchedMovies[i].Genre.length; j++) {
				genres.push(watchedMovies[i].Genre[j]);
			}
		}
		// if the user has watched that genre twice, we can consider the user prefer that 
		// genre of movies
		tempArray = genres.sort();
		for (let i = 0; i < tempArray.length; i++) {
			if (tempArray[i + 1] === tempArray[i]) {
				favoriteGenres.push(tempArray[i])
			}
		}
	
	    //find movies with the genres that the current user frequently watched
          app.locals.db.collection("movie").find({
			  Genre : {$in: favoriteGenres}
		  })
		  .limit(6).toArray(function(err,result){
          if(err){
            res.status(401).send("Error");
            return;
          }
          res.status(200);

		  recommandMovies = result;
		  
		  //exclude the movies the user have watched
		  for( let i = 0; i < recommandMovies.length; i++){ 
		    for (let j = 0; j < targetUser.Watchlist.length; j++) {
				if ( recommandMovies[i].Title === targetUser.Watchlist[j]) {    
					recommandMovies.splice(i, 1); 
				}
			}
		  } console.log(review)
	      res.render('../private/ownprofille.pug',{ user: targetUser, movies: watchedMovies, people: followedPeople, recommand : recommandMovies, followeduser : followedUsers, reviews:review });
	    
      });
	    });
	   });
	 });
  });
})

app.post('/ownprofille',ownprofille);


app.get('/movies/:Title', (req, res) => {
  //console.log(req.params.Title);
  let reviews;
  let targetGenre = [];
  let similarMovies = [];
  app.locals.db.collection("user").findOne({username :req.session.username,Watchlist:req.params.Title}, function(err,result){
    if(err){
      res.status(401).send("Error");
      return;
    }
    res.status(200);
    //console.log(result);
    if(result==null){
      req.session.movieAddState = "Add"
    }else{
      req.session.movieAddState = "Delete"
    }
  req.session.movieTitle=req.params.Title;
  app.locals.db.collection("review").find({movie:req.session.movieTitle}).toArray(function(err, result){
		if(err){
			res.status(500).send("Error reading database.");
			return;
		}
  
  reviews = result;
  if(result == null){
    reviews = [];
  }
  
  app.locals.db.collection("movie").findOne({Title :req.params.Title}, function(err,result){
		if(err){
			res.status(401).send("Unauthorized");
			return;
		}
        res.status(200);
      
        const targetMovie = result;
	    targetGenre = result.Genre;
	  
        //find similar movies with current movie's genres
        app.locals.db.collection("movie").find({
			Genre : {$in: targetGenre}
		})
		.limit(6).toArray(function(err,result){
        if(err){
          res.status(401).send("Error");
          return;
        }
        res.status(200);

		similarMovies = result;
		//console.log(req.session.movieAddState)
		//exclude the current movie
		for( let i = 0; i < similarMovies.length; i++){ 
			if ( similarMovies[i].Title === targetMovie.Title) {    
				similarMovies.splice(i, 1); 
			}  
		}		
		res.render('movie',{ movie : targetMovie, reviews : reviews, reviewer : req.session.username, smovies : similarMovies,movieAddState:req.session.movieAddState});  
        });
      });
    }); 
  });
})
app.post('/movies/:Title',Add_removeMovie);
app.post('/movies/:Title',review);


app.get('/genre/:Type', (req, res) => {
  req.session.genre = req.params.Type;
  app.locals.db.collection("movie").find({Genre :req.params.Type}).toArray(function(err,result){
    if(err){
      res.status(401).send("Unauthorized");
      return;
    }
    res.status(200);
      
    let targetGenres = result;
	//let Genre = req.session.genre;
    res.render('genre',{ genre: targetGenres, genreType : req.params.Type});
  });  

})



app.get('/people/:name', (req, res) => {
  let movies
  let targetPerson
  let Collaborators=[];
  let name =[];
  let Collaborators1=[];
  let career = {
    
  }
  app.locals.db.collection("people").findOne({name :req.params.name}, function(err,result){
		if(err){
			res.status(401).send("Unauthorized");
			return;
		}
    //console.log(result);
    targetPerson = result;
    app.locals.db.collection("user").findOne({username :req.session.username,followedPeople:req.params.name}, function(err,result){
      if(err){
        res.status(401).send("Error");
        return;
      }
      res.status(200);
      //console.log(result);
      if(result==null){
        req.session.peopleFollowState = "Follow"
      }else{
        req.session.peopleFollowState = "Unfollow"
      }
    app.locals.db.collection("movie").find({Director: req.params.name}).toArray(function(err,x){
      if(err){
        res.status(401).send("123");
        return;
      }
      if (x.length){
        career.Director=(x);
        for(var i=0;i<x.length;i++){
          for(var j=0;j<x[i].Director.length;j++){
            if(name.indexOf(x[i].Director[j])==-1){
                Collaborators.push(x[i].Director[j]);
            }
          }
          for(var j=0;j<x[i].Actors.length;j++){
            if(name.indexOf(x[i].Actors[j])==-1){
                Collaborators.push(x[i].Actors[j]);
            }
          }
          for(var j=0;j<x[i].Writer.length;j++){
            if(name.indexOf(x[i].Writer[j])==-1){
                Collaborators.push(x[i].Writer[j]);
            }
          }
        }
      }
      //console.log(followedUsers);
    
    app.locals.db.collection("movie").find({Actors: req.params.name}).toArray(function(err,y){
      if(err){
        res.status(401).send("123");
        return;
      }
      if (y.length){
        career.Actors=(y);
        for(var i=0;i<y.length;i++){
          for(var j=0;j<y[i].Director.length;j++){
            if(name.indexOf(y[i].Director[j])==-1){
                Collaborators.push(y[i].Director[j]);
            }
          }
          for(var j=0;j<y[i].Actors.length;j++){
            if(name.indexOf(y[i].Actors[j])==-1){
                Collaborators.push(y[i].Actors[j]);
            }
          }
          for(var j=0;j<y[i].Writer.length;j++){
            if(name.indexOf(y[i].Writer[j])==-1){
                Collaborators.push(y[i].Writer[j]);
            }
          }
        }
      }
      //console.log(followedUsers);
    app.locals.db.collection("movie").find({Writer: req.params.name}).toArray(function(err,z){
      if(err){
        res.status(401).send("123");
        return;
      }
      if (z.length){
        career.Writer=(z);
        for(var i=0;i<z.length;i++){
          for(var j=0;j<z[i].Director.length;j++){
            if(name.indexOf(z[i].Director[j])==-1){
                Collaborators.push(z[i].Director[j]);
            }
          }
          for(var j=0;j<z[i].Actors.length;j++){
            if(name.indexOf(z[i].Actors[j])==-1){
                Collaborators.push(z[i].Actors[j]);
            }
          }
          for(var j=0;j<z[i].Writer.length;j++){
            if(name.indexOf(z[i].Writer[j])==-1){
                Collaborators.push(z[i].Writer[j]);
            }
          }
        }
      }
      for(var i=0;i<5;i++){
        Collaborators1.push(Collaborators[i])
      }
      console.log(career);
      res.status(200);
      console.log(req.session.peopleFollowState);
      res.render('people',{ person: targetPerson, Career: career, Collaborators: Collaborators1, peopleFollowState : req.session.peopleFollowState});
    });
    });
    });
    });
	});  
})
app.post('/people/:name', peoplefollow);

app.get('/search', (req, res) => {
  res.statusCode = 200;
  res.render('search');
})

app.post('/search',search);


function search(req, res, next) {
  let title = req.body.title;
  let genre = req.body.genre;
  let actorName = req.body.actorName;

  console.log("searchresults input:");
  console.log("Title: " + title);
  console.log("Genre: " + genre);
  console.log("Actor Name: " + actorName);

  if(title && genre && actorName){
    app.locals.db.collection("movie").find({Title :title,Genre: genre,Actors:actorName}).toArray(function(err,result){
      if(err)throw err;
      if(result==null){
        res.status(401).send("no find");
        return;
      }
    
      res.status(200);
      req.session.movies = result;
      res.redirect("/searchresults?");
      return;
    });
  }

  else if(title && actorName){
    app.locals.db.collection("movie").find({Title :title,Actors:actorName}).toArray(function(err,result){
      if(err)throw err;
      if(result==null){
        res.status(401).send("no find");
        return;
      }
    
      res.status(200);
      req.session.movies = result;
      res.redirect("/searchresults?");
      return;
      //console.log(result);
    });
  }

  else if(title && genre){
    app.locals.db.collection("movie").find({Title :title,Genre: genre}).toArray(function(err,result){
      if(err)throw err;
      if(result==null){
        res.status(401).send("no find");
        return;
      }
    
      res.status(200);
      req.session.movies = result;
      res.redirect("/searchresults?");
      return;
      //console.log(result);
    });
  }

  else if(title){
    app.locals.db.collection("movie").find({Title :title}).toArray(function(err,result){
      if(err)throw err;
      if(result==null){
        res.status(401).send("no find");
        return;
      }
    
      res.status(200);
      req.session.movies = result;
      res.redirect("/searchresults?");
      return;
    });
  }
  else if(genre){
    app.locals.db.collection("movie").find({Genre :genre}).toArray(function(err,result){
      if(err)throw err;
      if(result==null){
        res.status(401).send("no find");
        return;
      }
    
      res.status(200);
      req.session.movies = result;
      res.redirect("/searchresults?");
      return;
    });
  }
  else if(actorName){
    app.locals.db.collection("movie").find({Actors :actorName}).toArray(function(err,result){
      if(err)throw err;
      if(result==null){
        res.status(401).send("no find");
        return;
      }
    
      res.status(200);
      req.session.movies = result;
      res.redirect("/searchresults?");
    });
  }
}


app.get('/users/:name', (req, res) => {
  let movies;
  let people;
  let watchedMovies = [];
  let genres = [];
  let tempArray = [];
  let favoriteGenres = [];
  let recommandMovies = [];
	
    app.locals.db.collection("review").find({reviewer :req.params.name}).toArray(function(err,result){
      if(err){
        res.status(401).send("Error");
        return;
      }
      res.status(200);
      const review = result;
	
    app.locals.db.collection("user").findOne({username :req.params.name}, function(err,result){
		if(err){
			res.status(401).send("Error");
			return;
		}
		res.status(200);
		const targetUser = result;
		app.locals.db.collection("people").find({name : {$in: targetUser.followedPeople}}).toArray(function(err,result){
      if(err){
        res.status(401).send("Error");
        return;
      }
      res.status(200);
      const followedPeople = result;

		// find user's watchlist from movie collection
		app.locals.db.collection("movie").find({
			Title : {$in: targetUser.Watchlist}
		}).toArray(function(err,result){
        
		if(err){
          res.status(401).send("Error");
          return;
        }
        res.status(200);

		watchedMovies = result;
		
		// get the genres from user's watchlist
		for( let i = 0; i < watchedMovies.length; i++){ 
			for (let j = 0; j < watchedMovies[i].Genre.length; j++) {
				genres.push(watchedMovies[i].Genre[j]);
			}
		}
		// if the user has watched that genre twice, we can consider the user prefer that 
		// genre of movies
		tempArray = genres.sort();
		for (let i = 0; i < tempArray.length; i++) {
			if (tempArray[i + 1] === tempArray[i]) {
				favoriteGenres.push(tempArray[i])
			}
		}
	
	    //find movies with the genres that the current user frequently watched
          app.locals.db.collection("movie").find({
			  Genre : {$in: favoriteGenres}
		  })
		  .limit(6).toArray(function(err,result){
          if(err){
            res.status(401).send("Error");
            return;
          }
          res.status(200);

		  recommandMovies = result;
		  
		  //exclude the movies the user have watched
		  for( let i = 0; i < recommandMovies.length; i++){ 
		    for (let j = 0; j < targetUser.Watchlist.length; j++) {
				if ( recommandMovies[i].Title === targetUser.Watchlist[j]) {    
					recommandMovies.splice(i, 1); 
				}
			}
		  }
	       res.render('users',{ user: targetUser, movies: watchedMovies, people: followedPeople, recommand : recommandMovies, reviews:review});
	      });
        });
	    });
	  }); 
   });	
})


app.get('/review/:reviewer', (req, res) => {
  app.locals.db.collection("review").findOne({reviewer :req.params.reviewer}, function(err,result){
		if(err){
			res.status(401).send("Unauthorized");
			return;
		}
		res.status(200);
    //console.log(result);
    const targetReview = result;
    res.render('review',{ review:targetReview});
	});  
})

app.get('/searchresults?', (req, res) => {
    const movies = req.session.movies;
    console.log(movies);
    res.statusCode = 200;
    res.render('searchResult',{ movies: movies});
})

app.get('/cards',(req,res)=>{
	res.render("index")
});


app.get('/contribut',auth, (req, res) => {
  console.log(req.session.contribut);
  if (req.session.contribut != "contributing") {
    return res.send("You are not contribut");
  }
  res.statusCode = 200;
  res.render('contribute');
})

app.post("/contribut",addmovie);

function addmovie(req, res, next) {
  //console.log(req.body);
  if(req.body.Title){
    let title=req.body.Title
    req.session.addmovie =req.body;
    app.locals.db.collection("movie").findOne({Title :title}, function(err,x){
      if(err) throw err;
      //console.log(x);
      if(x==null){
        app.locals.db.collection("movie").insertOne(req.session.addmovie, function(err,result){
          if(err){
            res.status(401).send("Unauthorized");
            return;
          }
          res.status(200);
        });
      }
      else{
        app.locals.db.collection("movie").replaceOne({Title :title}, req.session.addmovie, function(err,result){
          if(err) throw err;
          res.status(200);
          //console.log(req.session.addmovie);
        });
      }
    });
  }
  else if(req.body.name){
    //console.log(req.body.name);
    app.locals.db.collection("people").findOne({name :req.body.name}, function(err,x){
      if(err) throw err;
      //console.log(x);
      if(x==null){
        app.locals.db.collection("people").insertOne(req.body, function(err,result){
          if(err){
            res.status(401).send("Unauthorized");
            return;
          }
          res.status(200);
        });
      }
      else{
        res.send("Actors name already added");
        //app.locals.db.collection("people").replaceOne({name :req.body.name}, req.body, function(err,result){
        //  if(err) throw err;
        //  res.status(200);
          //console.log(req.session.addmovie);
      //  });
      }
    });
  }
}

function auth(request, res, next) {
  if (!request.session.loggedin) {
    return res.redirect("/login");
  }
  app.locals.db.collection("user").findOne({username :request.session.username}, function(err,result){
		if(err){
			res.status(401).send("Unauthorized");
			return;
		}
    if (!result.admin) {
      return res.status(401).send("Unauthorized");
    }
		res.status(200);
    request.session.contribut = result.contribut
   // console.log(result.contribut);
	});
  next();
}

//login
function login(req, res, next) {
  //console.log(req.body.loggedin);
  if (req.session.loggedin) {
    res.status(200);
    res.redirect('/logout');
    return;
  }
  let name = req.body.username;
  let password = req.body.password;
 
  console.log("Logging in with credentials:");
  console.log("Username: " + name);
  console.log("Password: " + password);

  app.locals.db.collection("user").findOne({username :name}, function(err,result){
		if(err) throw err;
    if(result==null){
			res.status(401).send("Unauthorized");
			return;
		}
    if (result.password === password) {
      req.session.loggedin = true;
      // We set the username associated with this session
      // On future requests, we KNOW who the user is
      // We can look up their information specifically
      // We can authorize based on who they are
      req.session.username = name;
      res.status(200);
      res.redirect("/ownprofille");
    } else {
      res.status(401).send("Not authorized. Invalid password.");
    }
		//console.log(result);
	});
}

function signup(req, res, next) {
  //console.log(req.body.loggedin);
  let name = req.body.username;
  let password = req.body.password;
  let confirmpassword = req.body.confirmpassword;
 
  console.log("Signing up with credentials:");
  console.log("Username: " + name);
  console.log("Password: " + password);
  console.log("confirm password: " + confirmpassword);

  app.locals.db.collection("user").findOne({username :name}, function(err,x){
		if(err) throw err;
    if(x==null){
      if (password === confirmpassword) {
        app.locals.db.collection("user").insertOne({username: name, password: password,admin:true ,contribut:"",Watchlist:[], followedUsers: [],followedPeople: []}, function(err,result){
          if(err){
            res.status(401).send("Unauthorized");
            return;
          }
          res.status(200);
          res.redirect("/login");
          //console.log(result);
        });
      }
      else{
        res.send("Confirm password not match");
      }
    }
    else{
      //console.log(x);
      res.send("Username has been used");
    }
	});
}

function ownprofille(req, res, next) {
  //console.log(req.body);
  let contribut = req.body.admin;
  if(req.body.admin=="Regular"){
    req.session.contribut = contribut;
    
  }
  if(req.body.admin=="contributing"){
    req.session.contribut = contribut;
   
  }
  app.locals.db.collection("user").updateOne({username :req.session.username}, {$set: {contribut: req.session.contribut}}, function(err,result){
		if(err) throw err;
    res.status(200).redirect("/ownprofille");
		//console.log(result);
	});
  if(req.body.UnfollowPeople){
    let unfollowPeople = req.body.UnfollowPeople;
    //console.log(req.session.followedPeople);
    let follow = req.session.followedPeople.filter((item)=>{
      return item!=unfollowPeople
    })
    app.locals.db.collection("user").updateOne({username:req.session.username},{$set: {followedPeople: follow}}, function(err,result){
      if(err) throw err;
      //res.redirect("/ownprofille");
      //console.log(result);
    });
  }
  else if(req.body.UnfollowUser){

    let unfollowUser = req.body.UnfollowUser;
    //console.log( req.session.followedUsers);
    let follow=req.session.followedUsers.filter((item)=>{
      return item!=unfollowUser
    })
    app.locals.db.collection("user").updateOne({username:req.session.username},{$set: {followedUsers: follow}}, function(err,result){
      if(err) throw err;
      //res.redirect("/ownprofille");
      //console.log(result);
    });
  }
}

function review(req, res, next) {
  console.log(req.body);
  if(!req.body.deleteMovie){
    req.session.Review = req.body;
    app.locals.db.collection("review").findOne({reviewer :req.session.username, movie:req.session.movieTitle}, function(err,x){
      if(err) throw err;
      //console.log(x);
      if(x == null){
        app.locals.db.collection("review").insertOne(req.session.Review, function(err,result){
          if(err){
            res.status(401).send("Error");
            return;
          }
          res.status(200);
        });
      }
      else{
        app.locals.db.collection("review").replaceOne({reviewer :req.session.username, movie:req.session.movieTitle}, req.session.Review, function(err,result){
          if(err) throw err;
          res.status(200);
        });
      }
    });
  }
}

function Add_removeMovie(req, res, next) {
  if(req.body.deleteMovie){
    let Movie=req.body.deleteMovie;
    app.locals.db.collection("user").findOne({username :req.session.username,Watchlist:Movie}, function(err,result){
      if(err){
        res.status(401).send("Error");
        return;
      }
      res.status(200);
      //console.log(result);
      if(result==null){
        req.session.watchlist.push(Movie);
        //console.log(req.session.followedPeople);
        app.locals.db.collection("user").updateOne({username :req.session.username}, {$set: {Watchlist:  req.session.watchlist}}, function(err,result){
          if(err) throw err;
          
          //console.log(result);
          res.redirect("/ownprofille");
        });

      }
      else{
        req.session.watchlist=req.session.watchlist.filter((item)=>{
          return item!=Movie;
        })
        app.locals.db.collection("user").updateOne({username:req.session.username},{$set: {Watchlist: req.session.watchlist}}, function(err,result){
          if(err) throw err;
          
          //console.log(result);
          res.redirect("/ownprofille");
        });
      } 
    });
  }
  next();
}
function peoplefollow(req, res, next) {
  if(req.body){
    let peoplename=req.body.peopleName
    app.locals.db.collection("user").findOne({username :req.session.username,followedPeople:peoplename}, function(err,result){
      if(err){
        res.status(401).send("Error");
        return;
      }
      res.status(200);
      //console.log(result);
      if(result==null){
        req.session.followedPeople.push(peoplename);
        //console.log(req.session.followedPeople);
        app.locals.db.collection("user").updateOne({username :req.session.username}, {$set: {followedPeople: req.session.followedPeople}}, function(err,result){
          if(err) throw err;
          
          //console.log(result);
          res.redirect("/ownprofille");
        });

      }
      else{
        req.session.followedPeople=req.session.followedPeople.filter((item)=>{
          return item!=peoplename;
        })
        app.locals.db.collection("user").updateOne({username:req.session.username},{$set: {followedPeople: req.session.followedPeople}}, function(err,result){
          if(err) throw err;
          
          //console.log(result);
          res.redirect("/ownprofille");
        });
      } 
    });
  }
}
// Connect to db and start server
// Note that this is connecting using mongoose now
mongo.connect("mongodb://localhost/27017/project", (err,client) => {
  if (err) throw err;  
  app.locals.db = client.db("project");

  app.listen(port);
  console.log(`Listening on port ${port}`);
})
let movieData = require("./database/movie-data-10.json");
let userData = require("./database/users.json");
let reviewData = require("./database/review.json");

function getpeople(){
	let people = [];
	let name=[];
	movieData.forEach(movie => {
		for(var i=0;i<movie.Director.length;i++){
			if(name.indexOf(movie.Director[i])==-1){
				name.push(movie.Director[i]);
				people.push({name:movie.Director[i]});
			}
		}
		for(var i=0;i<movie.Actors.length;i++){
			if(name.indexOf(movie.Actors[i])==-1){
				name.push(movie.Actors[i]);
				people.push({name:movie.Actors[i]});
			}
		}
		for(var i=0;i<movie.Writer.length;i++){
			if(name.indexOf(movie.Writer[i])==-1){
				name.push(movie.Writer[i]);
				people.push({name:movie.Writer[i]});
			}
		}
	})
	return people;
}
let peopleData = getpeople();

const mc = require("mongodb").MongoClient;

//This gives you a 'client' object that you can use to interact with the database
mc.connect("mongodb://localhost/27017/", function(err, client) {
	if(err) throw err;
	console.log("Connected to database.");
	
	let db = client.db('project');  
	
	db.collection("user").deleteMany({}, (err, result) => {
		if (err) {
			console.log("Deletion failed");
        throw err;
		}
	console.log("Deletion successful");
	
	db.collection("user").insertMany(userData, function(err,result){
		if(err) throw err;
		
		//console.log(result);
	});
  });
  
	db.collection("movie").deleteMany({}, (err, result) => {
		if (err) {
			console.log("Deletion failed");
		throw err;
		}
	console.log("Deletion successful");
	
	db.collection("movie").insertMany(movieData, function(err,result){
		if(err) throw err;
	});
  });
	
	db.collection("people").deleteMany({}, (err, result) => {
		if (err) {
			console.log("Deletion failed");
		throw err;
		}
	console.log("Deletion successful");
	
	db.collection("people").insertMany(peopleData, function(err,result){
		if(err) throw err;
		
		//console.log(result);
	});
  });
	
	db.collection("review").deleteMany({}, (err, result) => {
		if (err) {
			console.log("Deletion failed");
		throw err;
		}
    console.log("Deletion successful");
	db.collection("review").insertMany(reviewData, function(err,result){
		if(err) throw err;
		
		//console.log(result);
	});
  });
  
});
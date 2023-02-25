//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');
require('dotenv').config()

const app = express();

const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set('strictQuery', false);
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

const itemsSchema = new mongoose.Schema({
  name : {
    type : String
  }
})

const Item = mongoose.model("Item", itemsSchema)

const item1 = new Item({
  name : "Welcome to your todolist!"
})
const item2 = new Item({
  name : "Hit the + button to add a new item."
})
const item3 = new Item({
  name : "<-- Hit this to delete an item"
})

const defaultItems = [item1,item2,item3];

const listSchema = {
  name : String,
  items : [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {
  
  Item.find({} , (err, FoundItems) =>{

    if(FoundItems.length === 0){
      Item.insertMany(defaultItems , (err)=>{
        if(err){
          console.log(err);
        } else {
          console.log("Successfully insert all the documents.");
        }
      })
      res.redirect('/')
    } else {
      res.render("list", {listTitle: "Today", newListItems: FoundItems});
      
    }

  })

});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if(!err){
      if(!foundList){
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        
        res.redirect('/' + customListName);

        } else {
          //Show an existing list

          res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
          // console.log(foundList);
        }
    }
  });

  
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({ name : itemName});

  console.log(item);
  console.log(listName);
  if(listName === "Today"){
    item.save();
    res.redirect('/')
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName);
    });
  }
});

app.post("/delete" , function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(!err){
        console.log("Successfully deleted checked item.");
        res.redirect('/')
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull:{items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect('/' + listName);
      }
    });
  }
});

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});


connectDB().then(() => {
  app.listen(PORT, () => {
      console.log("Server has started successfully");
  })
})

const express = require('express')
const app = express()
const port = process.env.port || 6769
var cors = require('cors')
require('dotenv').config()
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const uri =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ioy1chb.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const database = client.db("Final");

    const movies = database.collection("menu");
    const movies2=database.collection("addmenuitem");
    const user=database.collection("user");
 const verifyjwt=(req,res,next)=>{
  const authorization=req.headers.authorization;
  console.log("authorization",authorization);
  if(!authorization){
return res.status(401).send({error:true,message:"unauthorized user"})
  };
  const token=req?.headers?.authorization.split(" ")[1];
  console.log("token",token);
  jwt.verify(token, process.env.GENERATE_KEY, function(err, decoded) {
   
      if(err){
        
          return res.status(403).send({error:true,message:"no valid user"})

      }
     req.decoded=decoded;
      next();
    });
 } 
 const verifyAdmin=async(req,res,next)=>{
  const decod=req.decoded;
const email=decod.email;
const query={email:email};
const finddata=await user.findOne(query);

  if(finddata?.role!=="Admin"){
  return  res.status(403).send({error:true,message:"forbidden user"})
   
  }
  next();

 } 
app.post('/users',async(req,res)=>{
  const data=req.body;
  const email=data.email;
  const query={email:email};
  const avoiddata=await user.findOne(query);
  if(avoiddata){
 return   res.send({message:"user already exists"});
  }
  const result=await user.insertOne(data);
  res.send(result);
})
   app.delete('/usersdata/:id',async(req,res)=>{
    const id=req.params.id;
    const query={_id:new ObjectId(id)};
    const result=await user.deleteOne(query);
    res.send(result);
   })
   app.post('/jwt',async(req,res)=>{
const data=req.body;
var token = jwt.sign(data, process.env.GENERATE_KEY, { expiresIn: '10h' });
console.log("mytoken",token);
res.send({token});

   })
    app.post('/carts',async(req,res)=>{

      const data=req.body;
      const result = await movies2.insertOne(data);
      res.send(result);
    });
    app.delete('/deletecarts/:id',async(req,res)=>{
      const id=req.params.id;
      const query = { _id:new ObjectId(id)};

      const result = await movies2.deleteOne(query);
      res.send(result);
    });
    app.get('/updateUsersall/:email',verifyjwt,async(req,res)=>{
const email=req.params.email;
console.log(email);
const query={email:email};
const data=await user.findOne(query);
console.log("getdata",data);
if(data?.role==="Admin"){
  const admin={Admin:data?.role==="Admin"};
  console.log(admin);
  res.send(admin);
}


    })
    app.patch('/updateUsers/:id',async(req,res)=>{

      const id=req.params.id;
      const query={_id:new ObjectId(id)};
      const updateDoc = {

        $set: {
  
          role:"Admin"
  
        },
  
      };
  
  const result=await user.updateOne(query,updateDoc);
  res.send(result);
    })
    app.get('/usersdata',verifyjwt,verifyAdmin,async(req,res)=>{
      const data=await user.find().toArray();
      res.send(data);
    })
    app.get('/menu',async(req,res)=>{
        
      const result=await movies.find().toArray();
      res.send(result);
  })
  app.get('/menus',verifyjwt,verifyAdmin,async(req,res)=>{
        
    const result=await movies.find().toArray();
    res.send(result);
})
app.delete('/deletemenuitem/:id',verifyjwt,verifyAdmin,async(req,res)=>{
  const id=req.params.id;
  const query={_id:new ObjectId(id)};
  const result=await movies.deleteOne(query);
  res.send(result);
})
    app.get('/catscollection',verifyjwt,async(req,res)=>{
      const decod=req.decoded;
      console.log(decod);
        console.log(req?.query?.email);
        let query={};
        if(req?.query?.email){
          query={email:req?.query?.email}
        }
        if(decod.email!==req?.query?.email){
          return res.status(403).send({error:true,message:"forbidden user"})
        }
      const result=await movies2.find(query).toArray();
      res.send(result);
    })
    app.post('/addintomenu',verifyjwt,verifyAdmin,async(req,res)=>{
      const data=req.body;
      const result = await movies.insertOne(data);
      res.send(result);
    })
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
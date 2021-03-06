const users=require('../src/database/data').users;
const MAX = process.env.API_MAX || 25 //TODO


const genKey = () =>{
  return [...Array(30)]
  .map((e)=>((Math.random()*36) | 0).toString(36))
  .join('');
}
const createUser = (_email, req)=>{
  let today = new Date().toISOString().split('T')[0];
  console.log(today)
  let user = {
    _id:Date.now(),
    api_key:genKey(),
    email:_email,
    host:req.headers.origin,
    usage:[{date:today, count:0}]
  }
  console.log(users)
  console.log(user)
  users.push(user)
  // saveToDatabase(users)
  return user;

}
const validateKey = (req,res,next)=>{
  //get the API key from the host
  let host = req.headers.origin;
  // let api_key=req.query.api_key; //1. with querystring

  let api_key=req.header('x-api-key');
  let account = users.find(
    (user)=>user.host == host && user.api_key == api_key
  );
  if (account) {
    let today = new Date().toISOString().split('T')[0];
    let usageIndex = account.usage.findIndex((day) => day.date == today);
    //a request today
    if (usageIndex >= 0) {
      //already used today
      if (account.usage[usageIndex].count >= MAX) {
        //stop and respond
        res.status(429).send({
          error: {
            code: 429,
            message: 'Max API calls exceeded.',
          },
        });
      } else {
        //has not hit todays max usage
        account.usage[usageIndex].count++;
        console.log('Good API call', account.usage[usageIndex]);
        next();
      }
    } else {
      //not today yet
      account.usage.push({ date: today, count: 1 });
      //ok to use again
      next();
    }
  } else {
    //stop and respond
    res.status(403).send({ error: { code: 403, message: 'You not allowed.' } });
  }
}
module.exports = {createUser, validateKey}
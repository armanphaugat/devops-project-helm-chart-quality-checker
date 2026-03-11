const buckets=new Map();
const rateLimiter=({
    capacity=100,
    refillRate=1
})=>{
    return (req,res,next)=>{
        const key=req.user?._id?.toString() || req.ip;
        const now=Date.now();
        if(!buckets.has(key)){///if bucket empty then full the bucket
            buckets.set(key,{
                tokens:capacity,
                lastRefillTime:now
            })
        }
        const bucket=buckets.get(key)
        const timePassed=now-bucket.lastRefillTime
        const secondsPassed=timePassed/1000
        const tokensToAdd=Math.floor(secondsPassed*refillRate)
        if(tokensToAdd>0){
            bucket.tokens=Math.min(capacity,bucket.tokens+tokensToAdd) 
            bucket.lastRefillTime=now
        }
        if(bucket.tokens<=0){
            return res.status(429).json({
                success:false,message:"Too Many Requests"
            })
        }
        bucket.tokens-=1
        next();
    }
}
export default rateLimiter
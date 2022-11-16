const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config();


const app = express();

//middle were
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.taqpwn0.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        const appointmentOptionCollection = client.db('doctorsPortal').collection('appointmentOptions');
        const bookingCollections = client.db('doctorsPortal').collection('booking')

        //appointment data collection here
        app.get('/appointmentOptions', async(req,res)=>{
            const date = req.query.date;
            const query = {};
            const options = await appointmentOptionCollection.find(query).toArray();
            const bookingQuery ={appointmentDate: date} ;
            const alreadyBooked = await bookingCollections.find(bookingQuery).toArray();
            options.forEach(option =>{
                const optionBooked = alreadyBooked.filter(book => book.treatment === option.name)
                const bookedSlot = optionBooked.map(book => book.slot);
                const remainingSlots = option.slots.filter(slot=> !bookedSlot.includes(slot))
                option.slots = remainingSlots;
                // console.log(date, option.name,  remainingSlots.length);
            })
            res.send(options)

        })

        //booking data collection here
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const query = {
                appointmentDate: booking.appointmentDate,
                email: booking.email,
                treatment: booking.treatment 
            }

            const alreadyBooked = await bookingCollections.find(query).toArray();

            if (alreadyBooked.length){
                const message = `You already have a booking on ${booking.appointmentDate}`
                return res.send({acknowledged: false, message})
            }

            const result = await bookingCollections.insertOne(booking);
            res.send(result);
        })
    }
    finally{

    }
}
run().catch(console.log())




app.get('/', (req, res)=>{
    res.send('doctors portal server api on the display')
})

app.listen(port, ()=>{
    console.log(`doctors portal server running in port ${port}`);
})
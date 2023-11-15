const mongoose = require('mongoose');

const componentSchema = new mongoose.Schema({
    title:{
        type: String,
        required: [true, 'Title cannot be blank']
    },
    tag:{
        type: String,
        required: [true, 'Tag cannot be blank']
    },
    description:{
        type: String,
        required: [false, 'Description cannot be blank']
    },
    code:{
        type: String,
        required: [true, 'Code cannot be blank']
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
})

module.exports=mongoose.model('Component',componentSchema);
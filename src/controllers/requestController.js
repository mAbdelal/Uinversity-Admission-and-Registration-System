const Request = require("../models/request-model");

const respondToRequest = async (req, res) => {
    const { requestId } = req.params; 
    const { response } = req.body; 

    try {
        const request = await Request.findById(requestId);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (request.response) {
            return res.status(400).json({ message: 'A response already exists for this request' });
        }

        if (req.user.role !== request.responderPossiblePosition) {
            return res.status(403).json({ message: 'You are not authorized to respond to this request' });
        }

        request.response = response;
        request.responseDate = new Date(); 
        request.responderID = req.user.id; 

        await request.save();

        res.status(200).json({ message: 'Response submitted successfully', request });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};


const createRequest = async (req, res, next) => {
    try {
        const {
            title,
            body,
            responderPossiblePosition, 
        } = req.body;

        const request = new Request({
            title,
            body,
            requesterID:req.user.id,
            requesterRole:req.user.role,
            responderPossiblePosition,
        });

        await request.save();

        res.status(201).json({ message: "Request created successfully", request });
    } catch (error) {
        res.status(500).json({ message: "Server error"});
    }
};


const getOwnRequests = async (req, res, next) => {
    try {
        const requests = await Request.find({ requesterID:req.user.id });

        res.status(200).json({ requests });
    } catch (error) {
        res.status(500).json({ message: "Server error"});
    }
};


const getOwnResponses = async (req, res, next) => {
    try {
        const { responderID } = req.params;
        const requests = await Request.find({ responderID:req.user.id });

        res.status(200).json({ requests });
    } catch (error) {
        res.status(500).json({ message: "Server error"});
    }
};

const getRequests = async (req, res) => {
    try {
        const {
            title,
            response,
            responderID,
            requesterID,
            requesterRole,
            responderPossiblePosition, 
            requestDateStart,
            requestDateEnd,
            responseDateStart,
            responseDateEnd
        } = req.query;

        const filter = {};

        if (title) filter.title = { $regex: title, $options: "i" };


        if (response) filter.response = { $regex: response, $options: "i" }; 

        if (responderID) filter.responderID = responderID;

        if (requesterID) filter.requesterID = requesterID;

        if (requesterRole) filter.requesterRole = requesterRole;

        if (responderPossiblePosition) filter.responderPossiblePosition = responderPossiblePosition;

        if (requestDateStart || requestDateEnd) {
            filter.requestDate = {};
            if (requestDateStart) filter.requestDate.$gte = new Date(requestDateStart);
            if (requestDateEnd) filter.requestDate.$lte = new Date(requestDateEnd); 
        }

        if (responseDateStart || responseDateEnd) {
            filter.responseDate = {};
            if (responseDateStart) filter.responseDate.$gte = new Date(responseDateStart); 
            if (responseDateEnd) filter.responseDate.$lte = new Date(responseDateEnd); 
        }

        const requests = await Request.find(filter);

        res.status(200).json({ requests });
    } catch (error) {
        res.status(500).json({ message: "Server error"});
    }
};

module.exports = {
    createRequest,
    respondToRequest,
    getRequests, 
    getOwnResponses,
    getOwnRequests
};
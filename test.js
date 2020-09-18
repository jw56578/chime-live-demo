// Copyright 2019-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const AWS = require('aws-sdk');
const compression = require('compression');
const fs = require('fs');
const http = require('http');
const url = require('url');
const { v4: uuidv4 } = require('uuid');

// Store created meetings in a map so attendees can join by meeting title
const meetingTable = {};

// Use local host for application server
const host = '127.0.0.1:8080';

// Load the contents of the web application to be used as the index page
const indexPage = fs.readFileSync(`dist/${process.env.npm_config_app || 'meetingV2'}.html`);

// Create ans AWS SDK Chime object. Region 'us-east-1' is currently required.
// Use the MediaRegion property below in CreateMeeting to select the region
// the meeting is hosted in.
//https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html
// make env variables with the same name as what is in the credentials file
const chime = new AWS.Chime({ region: 'us-east-1',  accessKeyId: 'AKIA32ODTPAWBKT3KB4B', secretAccessKey:'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' });

// Set the AWS SDK Chime endpoint. The global endpoint is https://service.chime.aws.amazon.com.
chime.endpoint = new AWS.Endpoint(process.env.ENDPOINT || 'https://service.chime.aws.amazon.com');

async function createMeeting(){
    // Look up the meeting by its title. If it does not exist, create the meeting.
    let meeting = await chime.createMeeting({
        // Use a UUID for the client request token to ensure that any request retries
        // do not create multiple meetings.
        ClientRequestToken: uuidv4(),
        // Specify the media region (where the meeting is hosted).
        // In this case, we use the region selected by the user.
        MediaRegion: 'us-east-1',
        // Any meeting ID you wish to associate with the meeting.
        // For simplicity here, we use the meeting title.
        ExternalMeetingId: uuidv4(),
    }).promise();
    return meeting;
}

async function createAttendee(meetingId){
    // Create new attendee for the meeting
    const attendee = await chime.createAttendee({
    // The meeting ID of the created meeting to add the attendee to
    MeetingId: meetingId,

    // Any user ID you wish to associate with the attendeee.
    // For simplicity here, we use a random id for uniqueness
    // combined with the name the user provided, which can later
    // be used to help build the roster.
    ExternalUserId: uuidv4(),
    }).promise()
    return attendee
}
async function main(){

      // Return the meeting and attendee responses. The client will use these
      // to join the meeting.
    let meeting = await createMeeting();
    let attendee = await createAttendee(meeting.Meeting.MeetingId);

    let cancellation = await chime.deleteMeeting({
        MeetingId: meeting.Meeting.MeetingId,
      }).promise();
}
main();
// every time we chage the data structure, increase the version number by 1
var DATA_VERSION = '1';

// job status
var JobStatus = {};
JobStatus.New = 0;
JobStatus.Old = 1;
JobStatus.Updated = 2;
JobStatus.Closed = 3;

// job sources
var MERCYASCOT = 'mercyascot';
var ADHB = 'adhb';
var WDHB = 'wdhb';

// job data keys
var HREF = 'href';
var TITLE = 'title';
var DESCRIPTION = 'description';
var LOCATION = 'location';
var EXPERTISE = 'expertise';
var WORKTYPE = 'workType';
var LEVEL = 'level';
var POSTEDDATE = 'postedDate';
var CLOSEDATE = 'closeDate';
var UPDATEDDATE = 'updatedDate';
var SOURCE = 'source';
//var DATAVERSION = 'dataVersion';
//var USERDATA = 'userData';
var STATUS = 'status';

// user data keys
var ISFOLLOWED = 'isFollowed';

var jobProperties = [
    HREF,
    TITLE,
    DESCRIPTION,
    LOCATION,
    EXPERTISE,
    WORKTYPE,
    LEVEL,
    POSTEDDATE,
    CLOSEDATE,
    ISFOLLOWED,
    UPDATEDDATE,
    SOURCE,
    STATUS,
];

var logos = {};
logos[MERCYASCOT] = 'images/mercyascot-logo.gif';
logos[ADHB] = 'images/adhb-logo.png';
logos[WDHB] = 'images/wdhb-logo.png';

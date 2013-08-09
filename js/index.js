/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
 
var user_credentials;
var BASE_URL = "http://192.168.1.64:5000/rest/v1.0/";
var eventId, familyId, action, eventName, children, signedin, signedout, tagRecord, tagPrefix, tagNumber;

var FAMILYIN = "img/frame_in.png";
var FAMILYOUT = "img/frame_out.png";
var FAMILYBLANK = "img/framef-.png";
var FAMILYERROR = "img/frame_error.png";

var MIMETYPE = 'text/kidswork';

var jqmReady = $.Deferred();
var pgReady = $.Deferred();

var app = {
   // Application Constructor
   initialize: function() {
      this.bindEvents();
      var self = this;
      self.route();
   },
   bindEvents: function() {
      document.addEventListener('deviceready', this.onDeviceReady, false);
      $(window).on('hashchange', $.proxy(this.route, this));
   },
   onDeviceReady: function() {
       // The scope of 'this' is the event, hence we need to use app.
       console.log('deviceready');
       nfc.addNdefListener(nfcNdefCallback, function() {console.log("NFC NDEF listener successful");}, function() {console.log("NFC listener failed");});
       nfc.addTagDiscoveredListener(nfcTagDiscoveredCallback, function() {console.log("NFC Tag listener successful");}, function() {console.log("NFC listener failed");});       
   },
   route: function() {
        console.log('route');
        var page;
        var hash = window.location.hash;
        console.log(hash);
        if (!hash) {
            console.log('home');
            eventsPage();
        } else if (hash.match(/^#events$/)) {
            console.log('events');
            eventsPage();
        } else if (hash.match(/^#family$/)) {
            console.log('family');
            nfcReadInit();
        } else if (hash.match(/^#register$/)) {
            console.log('register');
            $('#r-list').listview('refresh');
        } else if (hash.match(/^#write_tag$/)) {
            console.log('write_tag');
            $('#w-message').hide();
            nfcWriteInit();        
        }
   },
   receivedEvent: function(event) {
      switch(event) {
        case 'deviceready':
            pgReady.resolve();
            break;
        default:
            break;
      }
   }
};
$(document).on("pageinit", function(event, ui) {
   jqmReady.resolve();
   
    // FastClick handler
    window.addEventListener('load', function() {
        FastClick.attach(document.body);
    }, false);
    
});
/**
 * General initialization.
 */
$.when(jqmReady, pgReady).then(function() {
    //Initialization code here
    if(app.callback) {
      app.callback();
    }
    
    console.log("Frameworks ready.");
});


// Check if the user is authorized, or redirect to login page
function authorization()
{
    if (!user_credentials)
    {
        // Redirect to login page
        $.mobile.changePage( "#login"); //, { transition: "pop"} );
        return false;
    }
    else
    {
        return user_credentials;
    }
}


function login()
{
    var username = $('#username').val();
    var password = $('#password').val();
    BASE_URL = $('#url').val(); // Set global variable
    
    // Re-initialise... just in case the page has been cached
    //init();
    
    var login_data = {
        "username": username,
        "password": password
    };
    
    var request = $.ajax({
        type: "POST",
        url: BASE_URL + "login",
        contentType:"application/json",
        dataType: "json",
        data: JSON.stringify(login_data),
        success: function() {
            user_credentials = username;
            $.mobile.changePage("#actions");
        },
        error: function(error) {
            console.log(error);
            $("#loginmessage").text("Login failed. Please check the credentials.");
            $.mobile.changePage( "#login");
        }
    });
    
}

function showEventsPage(act)
{
    $('#e-action').text(act);
    action = act;
    $.mobile.changePage("#events");
}

function eventsPage(event, data)
{
    //if (!authorization()) return;
    
    var items = ['<li data-role="list-divider">Events</li>'];

    var request = $.ajax({
        type: "GET",
        url: BASE_URL + "events",
        contentType:"application/json",
        dataType: "json",
        data: null,
        success: function(data) {
            for (var ev in data.result)
            {
                var e = data.result[ev];
                items.push('<li id="event' + e.event_id + '"><a href="#actions" onclick="actionsPage(\'' + e.event_id +'\',\''+ e.name + '\')" data-transition="slide" >' + e.name + '</a></li>');
            }
            $('#e-list li').remove();
            $('#e-list').append(items.join('\n'));
            $("#e-list").listview("refresh");        
        },
        error: function(error) {
            console.log("---events");
            console.log(JSON.stringify(error));
        }
    });

}

function actionsPage(event_id, event_name) {
    console.log("actionsPage");
    console.log(event_id);
    eventId = event_id;
    eventName = event_name;
    
    var items = [];
    $('#a-event').text(event_name);
    $('#r-event').text(event_name);
        
    $.mobile.changePage("#actions");

}

function familyPage(a)
{
    console.log("familyPage");
    console.log(eventName);
    var items = [];
    $('#f-event').text(eventName);
    action = a;
    $('#f-action').text(a);
    $('#r-action').text(a);
    
    // Reset the view
    familyId = null;
    children = [];
    signedin = [];
    signedout = [];
    $('#f-family_id').val("");
    $('#f-family').text("");
    $('#f-instructions').text("Scan or enter the family tag");
    
    $.mobile.changePage("#family");
}

function registerPage()
{
    console.log("registerPage");
    var items = [];
    $('#r-event').text(eventName);
    $('#r-action').text(action);
    
    // Reset the view
    //familyId = null;
    children = [];
    signedin = [];
    signedout = [];
    //$('#r-list').hide();
    var list = $('#r-list-in');
    list.empty();
    list.append('<li id="r-kids-in" data-role="list-divider">To Sign-In</li>');
    list.hide();
    //list.listview("refresh");
    $('#family_id').val("");
    $('#r-family').text("");
    $('#r-instructions').text("Scan or enter the family tag");
    
    $.mobile.changePage("#register");
}

function writeTagPage()
{
    $.mobile.changePage("#write_tag");
}

function writeTag()
{
    console.log("writeTag");
    
    var prefix = $("input[name=w-radio-choice]:checked").val();
    var tagnumber = $('#w-tagnumber').val();
    
    if (!tagnumber) {
        _slide_message("The 'Tag Number' must be entered", false);
        return;
    }
    
    // Format the record for the tag and save it, ready for writing
    // ...the write is called when the tag-discovered event is fired
    tagRecord = ndef.mimeMediaRecord(MIMETYPE, nfc.stringToBytes(prefix + tagnumber));
    
    _slide_message("Scan the tag to write code '" + prefix + tagnumber + "'", true, true);
}

function _slide_message(words, success, hold)
{
    var message = $('#w-message');
    alert(words);

    if (success) {
        message.removeClass( "message error" );
        message.addClass( "message success" );
    
    } else {
        message.removeClass( "message success" );
        message.addClass( "message error" );    
    }
    
    message.html('<h3>' + words + '</h3>');
    if (!hold) {
        message.slideDown('slow').delay(1000).slideToggle('slow');
    } else {
        message.slideDown('slow');
    }
}

function parentManual(e)
{
    if (e.keyCode==13) {
        familyId = $('#f-family_id').val();
        getFamily(familyId);
    }
}

function nfcWriteInit()
{
    // NFC Handler
    //nfc.addTagDiscoveredListener(nfcTagDiscoveredCallback, function() {console.log("NFC Tag listener successful");}, function() {console.log("NFC listener failed");});
    //nfc.removeNdefListener(null, null, null);
    //alert("nfcWriteInit");
}

function nfcReadInit()
{
    // NFC Handler
    //nfc.addNdefListener(nfcNdefCallback, function() {console.log("NFC NDEF listener successful");}, function() {console.log("NFC listener failed");});
    //nfc.removeTagDiscoveredListener(null, null, null);
    //alert("nfcReadInit");
}

function nfcNdefCallback(nfcEvent)
{
    var tag = nfcEvent.tag;
    var prefix_tag = tag.ndefMessage[0].payload;
    
    // Analyse the prefix and tag Number
    var groups = prefix_tag.match(/(^F)(\d+$)/);
    if ((!groups) || (groups.length != 3)) {
        alert("The tag number is invalid: " + prefix_tag);
        _slide_message("The tag number is invalid: " + prefix_tag, false);
        return; 
    }
    
    // Store the tag details
    tagPrefix = groups[1];
    tagNumber = groups[2];
    
    alert("The tag number: " + tagPrefix + tagNumber);
    
    var hash = window.location.hash;
    if ((tagPrefix == 'F') && (hash.match(/^#family$/))) {
        // Family tag scanned on the family page
        $('#f-family_id').val(tagNumber);
        getFamily(tagNumber);
    } else if ((tagPrefix == 'C') && (hash.match(/^#register$/))) {
        // Child tag scanned on registration page
        onChildScanned(tagNumber);
    } else if ((tagPrefix == 'L') && (hash.match(/^#leader$/))) {
        // Leader tag scanned
        _slide_message('Not implemented: ' + tagPrefix + tagNumber, false);
    } else {
        _slide_message('The scanned tag is incorrect for this stage: ' + tagPrefix + tagNumber, false);
    }
    
}


function nfcTagDiscoveredCallback(nfcEvent)
{
    alert("NFC Tag Discovered: " + JSON.stringify(nfcEvent) + " Hash:" + window.location.hash);
    // Write the tag
    if (tagRecord) {    
        nfc.write(
            [tagRecord], 
            function() {
                _slide_message("Wrote tag successfully", true);
            },
            function(error) {
                _slide_message(error, false);
            }
        );
        alert("NFC Tag Discovered: " + JSON.stringify(tagRecord));
    }
}


function getFamily(tag)
{
    var family_data = {
        "family_number": tag,
        "event_id": eventId
    };
    
    $.mobile.loading("show");
    var request = $.ajax({
        type: "POST",
        url: BASE_URL + "family",
        contentType:"application/json",
        dataType: "json",
        data: JSON.stringify(family_data),
        success: function(data) {
            if (data.error) {
                $('#f-errors').text(data.error);
                $('#f-status').attr('src',FAMILYERROR);
                $('#f-family').text("");
            } else {
                $('#r-errors').text("");
                $('#r-family').text(data.parent_name);      
                $('#r-status').attr('src',FAMILYIN);
                $('#r-instructions').text("Scan the children's tags and touch 'register' to finish");
                children = data.children;
                signedin = data.signed_in;
                signedout = data.signed_out;
                var html = registered(data.children, data.signed_in, data.signed_out);
                console.log(html);
                var list = $('#r-list');
                list.empty();
                list.append(html);
                $.mobile.loading("hide");
                $.mobile.changePage("#register");
            }
            $.mobile.loading("hide");
        },
        error: function(error) {
            $('#r-errors').text(error);
            $('#r-status').attr('src',FAMILYERROR);
            $.mobile.loading("hide");
            return null;
        }
    });
}

function registered(children, signedin, signedout)
{
    var html = '<li data-role="list-divider">Children</li>';
    if ((signedin.length === 0))
    {
        // Use the children list as no one is registered
        html += _reg_list(children, false);
    } else {
        html += _reg_list(signedin, true);
        //html += _reg_list(signedout, false);        
    }
    
    return html;
}

function _reg_list(list, status)
{
    var html = "";
    var checked = "";
    
    for (var i in list)
    {
        k = list[i];
        var name = ' name="k-' + $.trim(k.personid) + '" ';
        var id = ' id="k-' + $.trim(k.tagnumber) + '" ';
        item = '<li'+ checked + '><a href="#"' + name + id + ' onclick="onChildClicked(this)">'+ k.name +'</a></li>';
        html += item;
    }
    return html;
}

function onChildClicked(el)
{
    // Add the child to the sign-in list (if not already there)
    var found = false;
    for (var i in signedin) {
        e = signedin[i];
        if (el.id == 'k-' + e.tagnumber) {
            found = true;
        }
    }
    
    if (!found) {
        signedin.push ({ tagnumber: el.id.replace('k-',''), personid: el.name.replace('k-',''), name: $(el).html()});
        var item = '<li><a href="#" name="' + el.name + '-in" id="' + el.id + '-in"' + '>'+ $(el).html() +'</a></li>';
        var list_in = $('#r-list-in');
        list_in.append(item);
        list_in.listview("refresh");
        list_in.show();
    }
}

function onChildScanned(tag)
{
    if ($('k-'+tag)) {
        // Valid child in the family
        onChildClicked($('k-'+tag));
    } else {
        // Get the child's details
        _slide_message("The child tag 'C" + tag + " is not in this family", false);
        
        // Child tag that does not belong to the family
        //var item = '<li><a href="#" name="' + el.name + '-in" id="' + el.id + '-in"' + ' data-theme="c">'+ $(el).html() +'</a></li>';
        //var list_in = $('#r-list-in');
        
    }
}

function childTagNumber(tagnumber, action)
{
    // Check if the tag number is for a child
    
        // +Get the child's details from the family list and add to sign-in list
        
        // -Get the child's details from CRM and add to sign-in list (highlighted)
        
        

}



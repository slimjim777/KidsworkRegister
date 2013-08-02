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
var eventId, familyId, action;

var FAMILYIN = "img/frame_in.png";
var FAMILYOUT = "img/frame_out.png";
var FAMILYBLANK = "img/frame.png";
var FAMILYERROR = "img/frame_error.png";

var jqmReady = $.Deferred();
var pgReady = $.Deferred();

var app = {
   //Callback for when the app is ready
   callback: null,
   // Application Constructor
   initialize: function(callback) {
      this.callback = callback;
      var browser = document.URL.match(/^https?:/);
      if(browser) {
         console.log("Is web.");
         //In case of web we ignore PG but resolve the Deferred Object to trigger initialization
	 pgReady.resolve();
      }
      else {
         console.log("Is not web.");
	 this.bindEvents();
      }
   },
   bindEvents: function() {
      document.addEventListener('deviceready', this.onDeviceReady, false);
   },
   onDeviceReady: function() {
      // The scope of 'this' is the event, hence we need to use app.
      app.receivedEvent('deviceready');
   },
   receivedEvent: function(event) {
      switch(event) {
         case 'deviceready':
	    pgReady.resolve();
	    break;
      }
   }
};
$(document).on("pageinit", function(event, ui) {
   jqmReady.resolve();
});
/**
 * General initialization.
 */
$.when(jqmReady, pgReady).then(function() {
   //Initialization code here
   if(app.callback) {
      app.callback();
   }
   
   // FastClick handler
   window.addEventListener('load', function() {
        FastClick.attach(document.body);
    }, false);
    
   console.log("Frameworks ready.");
});


/*
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        //document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    onDeviceReady: function() {
    },
};
*/

// Check if the user is authorized, or redirect to login page
function authorization()
{
    if (!user_credentials)
    {
        // Redirect to login page
        $.mobile.changePage( "#login"); //, { transition: "pop"} );
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
        "password": password,
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
            console.log("---failure");
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
            for (ev in data.result)
            {
                var e = data.result[ev];
                items.push('<li id="event' + e.event_id + '"><a href="#register" onclick="registerPage(\'' + e.event_id +'\',\''+ e.name + '\')" data-transition="slide" >' + e.name + '</a></li>');
            }
            $('#e-list li').remove();
            $('#e-list').append(items.join('\n'));
            $("#e-list").listview("refresh");        
        },
        error: function(error) {
            console.log("---events", error);
        }
    });

}

function registerPage(event_id, event_name)
{
    eventId = event_id;
    var items = [];
    $('#r-event').text(event_name);
    
    // Reset the view
    familyId = null;
    $('#r-list').hide();
    $('#family_id').val("");
    $('#r-family').text("");
    $('#r-instructions').text("Scan or enter the family tag");
    
    $.mobile.changePage("#register");
    console.log("Choose sign-in/out Page");
}

function parentManual(e)
{
    if (e.keyCode==13) {
        familyId = $('#family_id').val();
        console.log("Family ID ", familyId);
        getFamily(familyId);
    }
}

function getFamily(tag)
{
    var family_data = {
        "family_number": tag,
        "event_id": eventId,
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
                $('#r-errors').text(data.error);
                $('#r-status').attr('src',FAMILYERROR);
                $('#r-family').text("");
                $('#r-list').hide();
            } else {
                $('#r-errors').text("");
                $('#r-family').text(data.parent_name);      
                $('#r-status').attr('src',FAMILYIN);
                $('#r-instructions').text("Scan the children's tags and touch 'register' to finish");
                var html = registered(data.children, data.signed_in, data.signed_out)
                var list = $('#r-list');
                list.empty();
                list.append(html).listview('refresh');
                list.show();
            }
            $.mobile.loading("hide");
        },
        error: function(error) {
            console.log("---failure");
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
    if ((signedin.length==0) && (signedout.length==0))
    {
        // Use the children list as no one is registered
        html += _reg_list(children, false); 
    } else {
        html += _reg_list(signedin, true);
        html += _reg_list(signedout, false);        
    }
    
    return html;
}

function _reg_list(list, status)
{
    var html = "";
    var checked = "";
    if (status) {
        checked = ' data-icon="checkbox-on"';
    } else {
        checked = ' data-icon="checkbox-off"';    
    }
    
    for (i in list)
    {
        k = list[i];
        var name = ' name="k-' + $.trim(k.personid) + '" ';
        var id = ' id="k-' + $.trim(k.personid) + '" ';
        item = '<li'+ checked + '><a href="#"' + name + id + '>'+ k.name +'</a></li>';
        html += item;
    }
    return html;
}




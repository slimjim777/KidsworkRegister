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
    console.log(user_credentials);
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
            eventsPage();
            $.mobile.changePage( "#events");
        },
        error: function(error) {
            console.log("---failure");
            console.log(error);
    	    $("#loginmessage").text("Login failed. Please check the credentials.");
    	    $.mobile.changePage( "#login");
        }
    });
    
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
            console.log(data);
            for (ev in data.result)
            {
                var e = data.result[ev];
                items.push('<li id="event' + e.event_id + '"><a href="#inout" onclick="inoutPage(\'' + e.event_id +'\',\''+ e.name + '\')" data-transition="slide" >' + e.name + '</a></li>');
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

function inoutPage(event_id, event_name)
{
    var items = [];
    $('#d-event').text(event_name);
    console.log("Choose sign-in/out Page");
}

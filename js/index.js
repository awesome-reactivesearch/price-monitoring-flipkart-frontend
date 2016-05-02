// Copyright (c) 2014 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Get the current URL.
 *
 * @param {function(string)} callback - called when the URL of the current tab
 *   is found.
 */

const server_address = "http://104.131.165.92:8081"
var product_detail;

function getCurrentTabUrl(callback) {
    // Query filter to be passed to chrome.tabs.query - see
    // https://developer.chrome.com/extensions/tabs#method-query
    var queryInfo = {
        active: true,
        currentWindow: true
    };

    chrome.tabs.query(queryInfo, function(tabs) {
        // chrome.tabs.query invokes the callback with a list of tabs that match the
        // query. When the popup is opened, there is certainly a window and at least
        // one tab, so we can safely assume that |tabs| is a non-empty array.
        // A window can only have one active tab at a time, so the array consists of
        // exactly one tab.
        var tab = tabs[0];

        // A tab is a plain object that provides information about the tab.
        // See https://developer.chrome.com/extensions/tabs#type-Tab
        var url = tab.url;

        // tab.url is only available if the "activeTab" permission is declared.
        // If you want to see the URL of other tabs (e.g. after removing active:true
        // from |queryInfo|), then the "tabs" permission is required to see their
        // "url" properties.
        console.assert(typeof url == 'string', 'tab.url should be a string');

        callback(url);
    });

}

$.urlParam = function(name, url) {
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(url);
    if (results == null) {
        return null;
    } else {
        return results[1] || 0;
    }
}

function getProductDetails(parameters, callback) {
    $.ajax({
        type: 'get',
        url: server_address + '/get_product_details',
        data: parameters,
        success: function(d) {
            callback(d);
        },
        error: function() {
            console.log("error");
        }
    });
}

/* 
Simply adding the dyanamic feature. I UI there is select dropdown
 which is for range selection and this function is to add the event handling
 when select box is changed. Event handling done using jquery.
    Conventions -
    1) lcp :- less than current price
    2) fp :- fixed price
Below Select dropdown there are 2 input boxes, so on changing dropdown value ,
this event is triggered and is responsible for changing the values of input boxes.
 */
document.addEventListener('DOMContentLoaded', function() {
    $('select#dropper').on('change', function() {
        if ($('#dropper').val() == "lcp") {
            $('#gt').val(0);
            $('#lt').val(product_detail.price);
            $('#lt').attr('readonly', 'true');
        } else if ($('#dropper').val() == "fp") {
            $('#gt').val(product_detail.price);
            $('#lt').val(product_detail.price);
            $('#lt').removeAttr('readonly');
        } else {
            $('#gt').val(0);
            $('#lt').removeAttr('readonly');
        }
    });

    /*
        Event handling when less than input box is changed then greater input
        value should also get change only when selected value from dropdown is fp.
    */
    $('#lt').on('change', function() {
        if ($('#dropper').val() == "fp")
            $('#gt').val($('#lt').val());
    });

    /*
        This is to add the event on click of submit button, So as soon as submit button
        is clicked it sends all the parameters through ajax call.
    */
    $('#submit').on('click', function() {
        var parameters = {
            'lte': $('#lt').val(),
            'gte': $('#gt').val(),
            'email': $('#email').val(),
            'product_id': product_detail.product_id
        }
        console.log(parameters);
        /*
            Ajax call to the server with all the parameters.
        */
        $.ajax({
            type: 'GET',
            url: server_address + '/alert',
            data: parameters,
            success: function(d) {
                console.log(d);
            },
            error: function() {
                console.log("error");
            }
        });
        alert("You will receive an email, whenever the product price reaches according to you condition.");
    });

    /*
        This function is for calling the getCurrentTabUrl method as soon as the extension is
        loaded. This method is called with the callback function as parameter. Basically this 
        function is responsible for loading the product image and prics as soon as the flipkart
        product page is opened.
    */
    $(document).ready(function() {
        getCurrentTabUrl(function(url) {
            console.log(url);
            if ($.urlParam('pid', url) != null) {
                getProductDetails({ 'product_id': $.urlParam('pid', url) }, function(data) {
                    product_detail = data;
                    $('#details').text(product_detail.details);
                    $('#current_price').text(product_detail.price);
                    var image_url;
                    for (var key in product_detail.imageurls) {
                        image_url = product_detail.imageurls[key];
                    }
                    $('#img').attr('src', image_url);
                });
            }
        });
    });

});
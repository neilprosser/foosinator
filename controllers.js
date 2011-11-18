angular.service("serviceBaseUrl", function() {
    return "http://foosaholics.herokuapp.com/";
}, { $eager: "true" });

function FoosController($xhr, serviceBaseUrl) {
    var self = this;
    this.$xhr = $xhr;
    this.serviceBaseUrl = serviceBaseUrl;
    this.results = [];
    this.readResults();
};

FoosController.$inject = ["$xhr", "serviceBaseUrl"];

FoosController.prototype = {

    readResults : function() {
        this.$xhr("JSON", this.serviceBaseUrl + "results?callback=JSON_CALLBACK", this.callback, this.errorCallback);
    },

    callback : function(status, response) {
        this.results = response.results;
    },

    errorCallback : function(status) {
        console.log("Error: " + status);
    }

};


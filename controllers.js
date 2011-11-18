angular.service("serviceBaseUrl", function() {
    return "http://foosaholics.herokuapp.com/";
}, { $eager: "true" });

function FoosController($xhr, serviceBaseUrl) {
    this.$xhr = $xhr;
    this.serviceBaseUrl = serviceBaseUrl;
    this.results = [];
    this.players = [];
    this.readResults();
};

FoosController.$inject = ["$xhr", "serviceBaseUrl"];

FoosController.prototype = {

    readResults : function() {
        this.$xhr("JSON", this.serviceBaseUrl + "results?callback=JSON_CALLBACK", this.callback, this.errorCallback);
    },

    callback : function(status, response) {
        this.results = response.results;
        this.players = this.readPlayers(this.results);
    },

    errorCallback : function(status) {
        console.log("Error: " + status);
    },

    readPlayers : function(results) {
        var playersSet = {};
        angular.forEach(results, function(key, value) {
            this[key.team1.defender] = "";
            this[key.team1.attacker] = "";
            this[key.team2.defender] = "";
            this[key.team2.attacker] = "";
        }, playersSet);
        var players = [];
        angular.forEach(playersSet, function(key, value) {
            this.push({ name: value });
        }, players);
        return angular.Array.orderBy(players, "name");
    },

    nameIsNotLeft : function(item) {
        if (!item || !this.left) {
            return false;
        }
        return item.name !== this.left.name;
    },

    gamesIncludingPlayer : function(player) {
        if (!player) {
            return [];
        }

        var self = this;
        return angular.Array.filter(this.results, function(game) {
            return self.teamIncludesPlayer(game.team1, player) || self.teamIncludesPlayer(game.team2, player);
        });
    },

    gamesIncludingPlayers : function(playerOne, playerTwo) {
        if (!playerOne || !playerTwo) {
            return [];
        }

        var self = this;
        return angular.Array.filter(this.results, function(game) {
            if ((self.teamIncludesPlayer(game.team1, playerOne) || self.teamIncludesPlayer(game.team2, playerOne)) && (self.teamIncludesPlayer(game.team1, playerTwo) || self.teamIncludesPlayer(game.team2, playerTwo))) {
                return true;
            }
            return false;
        });
    },

    gamesIncludingPlayersOnSameTeam : function(playerOne, playerTwo) {
        if (!playerOne || !playerTwo) {
            return [];
        }

        var self = this;
        return angular.Array.filter(this.results, function(game) {
            if ((self.teamIncludesPlayer(game.team1, playerOne) && self.teamIncludesPlayer(game.team1, playerTwo)) ||
                    (self.teamIncludesPlayer(game.team2, playerOne) && self.teamIncludesPlayer(game.team2, playerTwo))) {
                return true;
            }
            return false;
        });
    },

    teamIncludesPlayer : function(team, player) {
        if (team.defender === player.name || team.attacker === player.name) {
            return true;
        }
        return false;
    }

};


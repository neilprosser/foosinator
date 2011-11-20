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
        this.results = angular.Array.orderBy(response.results, function(o) { return o.meta.timestamp; });
        this.players = this.readPlayers(this.results);
    },

    errorCallback : function(status) {
        console.log("Error: " + status);
    },

    readPlayers : function(results) {
        var self = this;
        var playersSet = {};
        angular.forEach(results, function(key, value) {
            var team1 = key.team1;
            var team2 = key.team2;
            var team1Win = team1.score > team2.score;

            var teamOneDefender = self.newPlayerIfAbsent(team1.defender, this);
            teamOneDefender.wins.all += team1Win;
            teamOneDefender.wins.defender += team1Win;
            teamOneDefender.losses.all += !team1Win;
            teamOneDefender.losses.defender += !team1Win;
            teamOneDefender.goals.all += team1.score;
            teamOneDefender.goals.defender += team1.score;
            teamOneDefender.conceded.all += team2.score;
            teamOneDefender.conceded.defender += team2.score;
            teamOneDefender.sequence.all.push(team1Win ? "W" : "L");
            teamOneDefender.sequence.defender.push(team1Win ? "W" : "L");

            var teamOneAttacker = self.newPlayerIfAbsent(team1.attacker, this);
            teamOneAttacker.wins.all += team1Win;
            teamOneAttacker.wins.attacker += team1Win;
            teamOneAttacker.losses.all += !team1Win;
            teamOneAttacker.losses.attacker += !team1Win;
            teamOneAttacker.goals.all += team1.score;
            teamOneAttacker.goals.attacker += team1.score;
            teamOneAttacker.conceded.all += team2.score;
            teamOneAttacker.conceded.attacker += team2.score;
            teamOneAttacker.sequence.all.push(team1Win ? "W" : "L");
            teamOneAttacker.sequence.attacker.push(team1Win ? "W" : "L");

            var teamTwoDefender = self.newPlayerIfAbsent(team2.defender, this);
            teamTwoDefender.wins.all += !team1Win;
            teamTwoDefender.wins.defender += !team1Win;
            teamTwoDefender.losses.all += team1Win;
            teamTwoDefender.losses.defender += team1Win;
            teamTwoDefender.goals.all += team2.score;
            teamTwoDefender.goals.defender += team2.score;
            teamTwoDefender.conceded.all += team1.score;
            teamTwoDefender.conceded.defender += team1.score;
            teamTwoDefender.sequence.all.push(!team1Win ? "W" : "L");
            teamTwoDefender.sequence.defender.push(!team1Win ? "W" : "L");

            var teamTwoAttacker = self.newPlayerIfAbsent(team2.attacker, this);
            teamTwoAttacker.wins.all += !team1Win;
            teamTwoAttacker.wins.attacker += !team1Win;
            teamTwoAttacker.losses.all += team1Win;
            teamTwoAttacker.losses.attacker += team1Win;
            teamTwoAttacker.goals.all += team2.score;
            teamTwoAttacker.goals.attacker += team2.score;
            teamTwoAttacker.conceded.all += team1.score;
            teamTwoAttacker.conceded.attacker += team1.score;
            teamTwoAttacker.sequence.all.push(!team1Win ? "W" : "L");
            teamTwoAttacker.sequence.attacker.push(!team1Win ? "W" : "L");
        }, playersSet);
        var players = [];
        angular.forEach(playersSet, function(key, value) {
            this.push(key);
        }, players);
        return angular.Array.orderBy(players, "name");
    },

    newPlayerIfAbsent : function(name, players) {
        var self = this;
        var player = players[name];
        if (!player) {
            player = {
                name: name,
                wins: {
                    all: 0,
                    defender: 0,
                    attacker: 0
                },
                losses: {
                    all: 0,
                    defender: 0,
                    attacker: 0
                },
                goals: {
                    all: 0,
                    defender: 0,
                    attacker: 0
                },
                conceded: {
                    all: 0,
                    defender: 0,
                    attacker: 0
                },
                sequence: {
                    all: [],
                    defender: [],
                    attacker: []
                },
                games : function() {
                    return {
                        all: this.wins.all + this.losses.all,
                        defender: this.wins.defender + this.losses.defender,
                        attacker: this.wins.attacker + this.losses.attacker
                    };
                },
                winRate : function() {
                    return {
                        all: self.calculateWinRate(this.wins.all, this.losses.all),
                        defender: self.calculateWinRate(this.wins.defender, this.losses.defender),
                        attacker: self.calculateWinRate(this.wins.attacker, this.losses.attacker)
                    };
                },
                streak : function() {
                    return {
                        all: self.calculateStreak(this.sequence.all),
                        defender: self.calculateStreak(this.sequence.defender),
                        attacker: self.calculateStreak(this.sequence.attacker)
                    };
                }
            };
            players[name] = player;
        }
        return player;
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

    gamesIncludingPlayersOnDifferentTeams : function(playerOne, playerTwo) {
        if (!playerOne || !playerTwo) {
            return [];
        }

        var self = this;
        return angular.Array.filter(this.results, function(game) {
            if ((self.teamIncludesPlayer(game.team1, playerOne) && self.teamIncludesPlayer(game.team2, playerTwo)) ||
                (self.teamIncludesPlayer(game.team1, playerTwo) && self.teamIncludesPlayer(game.team2, playerOne))) {
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
    },

    calculateStreak : function(sequence) {
        if (angular.Array.count(sequence) == 0) {
            return 0;
        }
        var lastResult;
        var reversedSequence = reverse(sequence);
        var streak = 0;
        for (var index in reversedSequence) {
            var value = reversedSequence[index];
            if (!lastResult) {
                lastResult = value;
            }
            if (value !== lastResult) {
                break;
            }
            streak++;
        }
        if (lastResult === "L") {
            streak *= -1;
        }
        return streak;
    },

    calculateWinRate : function(wins, losses) {
        var games = wins + losses;
        if (games == 0) {
            return 0;
        }
        return (wins / games) * 100;
    }

};

function reverse(a) {
    var result = [];
    var len = a.length;
    for (var i = (len - 1); i >= 0; i--) {
        result.push(a[i]);
    }
    return result;
}


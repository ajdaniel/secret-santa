(function () {
    angular.module('secretSanta')
        .factory('auth', function ($q, $http) {
            return {
                getProfile: function () {
                    return $http.get('/api/profile/me').then(function (profile) {
                        if (profile.data.user === 'logged_out') {
                            return null;
                        } else {
                            return profile.data.profile;
                        }
                    });
                },
                updatePreferences: function (newPreferences) {
                    return $http.put('/api/profile/me/preferences', newPreferences).then(function (data) {
                        return data.data;
                    });
                },
                updateEmail: function (newEmail) {
                    return $http.put('/api/profile/me/email', {email: newEmail}).then(function (data) {
                        return data.data;
                    });
                },
                getUsers: function () {
                    return $http.get('/api/admin/users').then(function (data) {
                        return data.data;
                    });
                },
                getUser: function (id) {
                    return $http.get('/api/profile/'+id).then(function (data) {
                        return data.data.user;
                    });
                },
                admin: {
                    matchUsers: function () {
                        return $http.post('/api/admin/actions', {action: 'match'}).then(function(data){
                            return data.data;
                        });
                    },
                    clearMatches: function () {
                        return $http.post('/api/admin/actions', {action: 'clear'}).then(function(data){
                            return data.data;
                        });
                    },
                    toggleUserAllowed: function (userId) {
                        return $http.post('/api/admin/actions', {action: 'toggleAllowed', userId: userId}).then(function(data){
                            return data.data;
                        });
                    }
                }
            };
        });
})();

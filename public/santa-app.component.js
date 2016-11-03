(function () {

    var santaApp = angular.module('secretSanta');

    santaApp.config(function ($mdThemingProvider) {
        $mdThemingProvider.theme('error');
    });

    santaApp.component('santaApp', {
        templateUrl: 'santa-app.component.html',
        controller: function (auth, $mdToast) {
            var ctrl = this;
            // init the profile
            ctrl.gettingProfile = true;
            // disable loading prefs
            ctrl.submittingPreferences = false;
            // editing of the email
            ctrl.editingEmail = false;

            function getAdminUsers() {
                auth.getUsers().then(function (users) {
                    ctrl.admin.users = users;
                });
            }

            ctrl.admin = {};

            ctrl.getProfileData = function () {
                auth.getProfile().then(function (profile) {
                    ctrl.profile = profile;
                    ctrl.gettingProfile = false;

                    if (profile.admin === true) {
                        getAdminUsers();
                    }
                });
            };
            // do this now
            ctrl.getProfileData();

            ctrl.editEmail = function () {
                ctrl.newEmail = ctrl.profile.email;
                ctrl.editingEmail = true;
            };

            ctrl.cancelEmailUpdate = function () {
                ctrl.editingEmail = false;
            };

            ctrl.updateEmail = function () {
                ctrl.submittingPreferences = true;
                auth.updateEmail(ctrl.profile.email).then(function (data) {
                    toastMessage(data.message, data.success);
                    if (data.success) {
                        ctrl.editingEmail = false;
                        ctrl.getProfileData();
                    }
                    ctrl.submittingPreferences = false;
                });
            };

            ctrl.submitPreferences = function () {
                ctrl.submittingPreferences = true;
                var newPreferences = {
                    likes: ctrl.profile.preferences.likes,
                    dislikes: ctrl.profile.preferences.dislikes,
                    wishlist: ctrl.profile.preferences.wishlist
                };
                auth.updatePreferences(newPreferences).then(function (data) {
                    toastMessage(data.message, data.success);
                    ctrl.submittingPreferences = false;
                });
            };

            ctrl.matchUsers = function () {
                auth.admin.matchUsers().then(function (msg) {
                    ctrl.getProfileData();
                    getAdminUsers();
                    toastMessage(msg.message, msg.success);
                });
            };

            ctrl.clearMatches = function () {
                auth.admin.clearMatches().then(function (msg) {
                    ctrl.getProfileData();
                    getAdminUsers();
                    toastMessage(msg.message, msg.success);
                });
            };

            ctrl.toggleAllowed = function (user) {
                auth.admin.toggleUserAllowed(user.id).then(function (msg) {
                    getAdminUsers();
                    toastMessage(msg.message, msg.success);
                });
            };

            window.toastMessage = toastMessage;
            function toastMessage(messageText, success) {
                success = success || false;
                if (!success) {
                    messageText = 'Error: ' + messageText;
                }
                $mdToast.show(
                    $mdToast.simple()
                        .textContent(messageText)
                        .position('top')
                        .hideDelay(3000)
                        .theme(success ? 'default' : 'error')
                );
            }
        }
    });

})();
!function(){angular.module("secretSanta").factory("auth",["$q","$http",function(a,b){return{getProfile:function(){return b.get("/api/profile/me").then(function(a){return"logged_out"===a.data.user?null:a.data.profile})},updatePreferences:function(a){return b.put("/api/profile/me/preferences",a).then(function(a){return a.data})},updateEmail:function(a){return b.put("/api/profile/me/email",{email:a}).then(function(a){return a.data})},getUsers:function(){return b.get("/api/admin/users").then(function(a){return a.data})},getUser:function(a){return b.get("/api/profile/"+a).then(function(a){return a.data.user})},admin:{matchUsers:function(){return b.post("/api/admin/actions",{action:"match"}).then(function(a){return a.data})},clearMatches:function(){return b.post("/api/admin/actions",{action:"clear"}).then(function(a){return a.data})},toggleUserAllowed:function(a){return b.post("/api/admin/actions",{action:"toggleAllowed",userId:a}).then(function(a){return a.data})}}}}])}(),function(){var a=angular.module("secretSanta");a.config(["$mdThemingProvider",function(a){a.theme("error")}]),a.component("santaApp",{templateUrl:"santa-app.component.html",controller:["auth","$mdToast",function(a,b){function c(){a.getUsers().then(function(a){e.admin.users=a})}function d(a,c){c=c||!1,c||(a="Error: "+a),b.show(b.simple().textContent(a).position("top").hideDelay(3e3).theme(c?"default":"error"))}var e=this;e.gettingProfile=!0,e.submittingPreferences=!1,e.editingEmail=!1,e.admin={},e.getProfileData=function(){a.getProfile().then(function(a){e.profile=a,e.gettingProfile=!1,a.admin===!0&&c()})},e.getProfileData(),e.editEmail=function(){e.newEmail=e.profile.email,e.editingEmail=!0},e.cancelEmailUpdate=function(){e.editingEmail=!1},e.updateEmail=function(){e.submittingPreferences=!0,a.updateEmail(e.profile.email).then(function(a){d(a.message,a.success),a.success&&(e.editingEmail=!1,e.getProfileData()),e.submittingPreferences=!1})},e.submitPreferences=function(){e.submittingPreferences=!0;var b={likes:e.profile.preferences.likes,dislikes:e.profile.preferences.dislikes,wishlist:e.profile.preferences.wishlist};a.updatePreferences(b).then(function(a){d(a.message,a.success),e.submittingPreferences=!1})},e.matchUsers=function(){a.admin.matchUsers().then(function(a){e.getProfileData(),c(),d(a.message,a.success)})},e.clearMatches=function(){a.admin.clearMatches().then(function(a){e.getProfileData(),c(),d(a.message,a.success)})},e.toggleAllowed=function(b){a.admin.toggleUserAllowed(b.id).then(function(a){c(),d(a.message,a.success)})},window.toastMessage=d}]})}();
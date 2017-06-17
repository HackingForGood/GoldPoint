
function ParentView() {

    this.checkSetup();

    // Shortcuts to DOM Elements.
    this.messageList = document.getElementById('messages');
    this.messageForm = document.getElementById('message-form');
    this.messageInput = document.getElementById('message');
    this.submitButton = document.getElementById('submit');
    this.submitImageButton = document.getElementById('submitImage');
    this.imageForm = document.getElementById('image-form');
    this.mediaCapture = document.getElementById('mediaCapture');
    this.userPic = document.getElementById('user-pic');
    this.userName = document.getElementById('user-name');
    this.signInButton = document.getElementById('sign-in');
    this.signOutButton = document.getElementById('sign-out');
    this.signInSnackbar = document.getElementById('must-signin-snackbar');

    // Saves message on form submit.
    this.signOutButton.addEventListener('click', this.signOut.bind(this));
    this.signInButton.addEventListener('click', this.signIn.bind(this));

    this.initFirebase();
}

// Sets up shortcuts to Firebase features and initiate firebase auth.
ParentView.prototype.initFirebase = function() {
  // Shortcuts to Firebase SDK features.
  this.auth = firebase.auth();
  this.database = firebase.database();
  // Initiates Firebase auth and listen to auth state changes.
  this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
};

// Checks that the Firebase SDK has been correctly setup and configured.
ParentView.prototype.checkSetup = function() {
  if (!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions and make ' +
        'sure you are running the codelab using `firebase serve`');
  }
};

// Signs-in Friendly Chat.
ParentView.prototype.signIn = function() {
  // Sign in Firebase using popup auth and Google as the identity provider.
  var provider = new firebase.auth.GoogleAuthProvider();
  this.auth.signInWithPopup(provider);
};

// Signs-out of Friendly Chat.
ParentView.prototype.signOut = function() {
  // Sign out of Firebase.
  this.auth.signOut();
};

// Saves the messaging device token to the datastore.
ParentView.prototype.saveMessagingDeviceToken = function() {
  firebase.messaging().getToken().then(function(currentToken) {
    if (currentToken) {
      console.log('Got FCM device token:', currentToken);
      // Saving the Device Token to the datastore.
      firebase.database().ref('/fcmTokens').child(currentToken)
          .set(firebase.auth().currentUser.uid);
    } else {
      // Need to request permissions to show notifications.
      this.requestNotificationsPermissions();
    }
  }.bind(this)).catch(function(error){
    console.error('Unable to get messaging token.', error);
  });
};

// Requests permissions to show notifications.
ParentView.prototype.requestNotificationsPermissions = function() {
  console.log('Requesting notifications permission...');
  firebase.messaging().requestPermission().then(function() {
    // Notification permission granted.
    this.saveMessagingDeviceToken();
  }.bind(this)).catch(function(error) {
    console.error('Unable to get permission to notify.', error);
  });
};

// Triggers when the auth state change for instance when the user signs-in or signs-out.
ParentView.prototype.onAuthStateChanged = function(user) {
  if (user) { // User is signed in!
    // Get profile pic and user's name from the Firebase user object.
    var profilePicUrl = user.photoURL;
    var userName = user.displayName;

    // Set the user's profile pic and name.
    this.userPic.style.backgroundImage = 'url(' + (profilePicUrl || '/images/profile_placeholder.png') + ')';
    this.userName.textContent = userName;

    // Show user's profile and sign-out button.
    this.userName.removeAttribute('hidden');
    this.userPic.removeAttribute('hidden');
    this.signOutButton.removeAttribute('hidden');

    // Hide sign-in button.
    this.signInButton.setAttribute('hidden', 'true');

    // We load currently existing chant messages.
    this.loadData();

    // We save the Firebase Messaging Device token and enable notifications.
    this.saveMessagingDeviceToken();
  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    this.userName.setAttribute('hidden', 'true');
    this.userPic.setAttribute('hidden', 'true');
    this.signOutButton.setAttribute('hidden', 'true');

    // Show sign-in button.
    this.signInButton.removeAttribute('hidden');
  }
};


window.onload = function() {
    window.parentView = new ParentView();
    console.log("onload");
    window.parentView.loadData();
};

ParentView.prototype.loadData = function() {

    console.log("loadData");

    // Reference to the /messages/ database path.
    this.teacherRef = this.database.ref('Class');
    // Make sure we remove all previous listeners.
    this.teacherRef.off();

    this.steps = []
    console.log(this.steps);
    var self = this;
    // Loads the last 12 messages and listen for new ones.
    var setData = function(data) {
        // var val = data.val();
        console.log("setData");
        console.log(data.val());
        // console.log(val);
        if (data.val()['Steps']) {
            self.steps = data.val()['Steps'];
            console.log('Steps found!')
            console.log(self.steps);
            this.rebuildTable();
        } else {
            console.log("No steps found in val():");
            console.log(data.val());
        }
    }.bind(this);
    this.teacherRef.limitToLast(12).on('child_added', setData);
    this.teacherRef.limitToLast(12).on('child_changed', setData);
};


ParentView.prototype.rebuildTable = function() {

    console.log("rebuildTable");
    console.log(this.steps);

    var html = '<table border="1">';
    html += "<tr>";
    html += "<th>Id</th>";
    html += "<th>Due Date</th>";
    html += "<th>Description</th>";
    html += "<th>StepType</th>";
    html += "</tr>";

      if (this.steps) {

      for (var key in this.steps) {
        var curr = this.steps[key];

      	html += "<tr>";
      	html += "<td>" + curr.StepId + "</td>";
      	html += "<td>" + curr.Date + "</td>";
      	html += "<td>" + curr.Description + "</td>";
      	html += "<td>" + curr.StepType + "</td>";
      	html += "</tr>";
      }

    }
    html += "</table>"

  // Pass our data to the template
  // var theCompiledHtml = theTemplate(context);

  console.log("Compiled HTML: " + html);
  // Add the compiled html to the page
  // $('.content-placeholder').html(theCompiledHtml);

  $('.content-placeholder').html(html);
};

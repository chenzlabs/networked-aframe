var naf = require('../NafIndex');
var NetworkInterface = require('./NetworkInterface');

class EasyRtcInterface extends NetworkInterface {
  constructor(easyrtc) {
    super();
    this.easyrtc = easyrtc;
  }

  /*
   * Call before `connect`
   */

  setSignalUrl(signalUrl) {
    this.easyrtc.setSocketUrl(signalUrl);
  }

  joinRoom(roomId) {
    this.easyrtc.joinRoom(roomId, null);
  }

  setRoomOccupantListener(occupantListener){
    this.easyrtc.setRoomOccupantListener(occupantListener);
  }

  // options: { datachannel: bool, audio: bool }
  setStreamOptions(options) {
    // this.easyrtc.enableDebug(true);
    this.easyrtc.enableDataChannels(options.datachannel);
    this.easyrtc.enableVideo(false);
    this.easyrtc.enableAudio(options.audio);
    this.easyrtc.enableVideoReceive(false);
    this.easyrtc.enableAudioReceive(options.audio);
    this.autoplayAudio = options.autoplayAudio;
  }

  setDatachannelListeners(openListener, closedListener, messageListener) {
    this.easyrtc.setDataChannelOpenListener(openListener);
    this.easyrtc.setDataChannelCloseListener(closedListener);
    this.easyrtc.setPeerListener(messageListener);
  }

  setLoginListeners(successListener, failureListener) {
    this.loginSuccess = successListener;
    this.loginFailure = failureListener;
  }


  /*
   * Network actions
   */

  connect(appId) {
    var that = this;
    var loginSuccessCallback = function(id) {
      that.myRoomJoinTime = that.getRoomJoinTime(id);
      that.loginSuccess(id);
    };

    if (this.easyrtc.audioEnabled) {
      this.connectWithAudio(appId, loginSuccessCallback, this.loginFailure);
    } else {
      this.easyrtc.connect(appId, loginSuccessCallback, this.loginFailure);
    }
  }

  connectWithAudio(appId, loginSuccess, loginFailure) {
    var that = this;

    this.easyrtc.setStreamAcceptor(function(easyrtcid, stream) {
      var sceneEl = document.querySelector('a-scene');
      var positionalAudioEl = sceneEl.querySelector('#sound-' + easyrtcid);
      if (positionalAudioEl) {
        console.warn('??? We already have #sound-' + easyrtcid);
	return;
      }
      positionalAudioEl = document.createElement('a-sound');
      positionalAudioEl.setAttribute('id', 'sound-' + easyrtcid);
      sceneEl.appendChild(positionalAudioEl);
      positionalAudioEl.addEventListener('loaded', function () {
        var audioEl = sceneEl.querySelector('#audio-' + easyrtcid);
        if (audioEl) {
          console.warn('??? We already have #audio-' + easyrtcid);
	  return;
        }
	audioEl = document.createElement("audio");
        audioEl.setAttribute('id', 'audio-' + easyrtcid);
        sceneEl.appendChild(audioEl);
        // setVideoObjectSrc seems to start the media, which we can't do
        // without risking createMediaElementSource() failing because already attached
        audioEl.setAttribute('src', that.easyrtc.createObjectURL(stream));
        // NOTE: panning works fine with test stream...
        //audioEl.src = '//threejs.org/examples/sounds/376737_Skullbeatz___Bad_Cat_Maste.ogg';
        //audioEl.crossOrigin = 'anonymous';
        var sound = positionalAudioEl.components.sound;
        sound.setupSound();
        sound.source = sound.listener.context.createMediaElementSource(audioEl);
        sound.pool.children[0].setNodeSource(sound.source);
        if (that.autoplayAudio) { audioEl.play(); }
      });
    });

    this.easyrtc.setOnStreamClosed(function (easyrtcid) {
      var positionalAudioEl = document.getElementById('sound-' + easyrtcid);
      positionalAudioEl.parentNode.removeChild(positionalAudioEl);
      var audioEl = document.getElementById('audio-' + easyrtcid);
      audioEl.parentNode.removeChild(audioEl);
    });

    this.easyrtc.initMediaSource(
      function(){
        that.easyrtc.connect(appId, loginSuccess, loginFailure);
      },
      function(errorCode, errmesg){
        console.error(errorCode, errmesg);
      }
    );
  }

  shouldStartConnectionTo(client) {
    return this.myRoomJoinTime <= client.roomJoinTime;
  }

  startStreamConnection(networkId) {
    this.easyrtc.call(networkId,
      function(caller, media) {
        if (media === 'datachannel') {
          naf.log.write('Successfully started datachannel to ', caller);
        }
      },
      function(errorCode, errorText) {
        console.error(errorCode, errorText);
      },
      function(wasAccepted) {
        // console.log("was accepted=" + wasAccepted);
      }
    );
  }

  closeStreamConnection(networkId) {
    // Handled by easyrtc
  }

  sendData(networkId, dataType, data) {
    this.easyrtc.sendDataP2P(networkId, dataType, data);
  }

  sendDataGuaranteed(networkId, dataType, data) {
    this.easyrtc.sendDataWS(networkId, dataType, data);
  }

  /*
   * Getters
   */

  getRoomJoinTime(clientId) {
    var myRoomId = naf.room;
    var joinTime = easyrtc.getRoomOccupantsAsMap(myRoomId)[clientId].roomJoinTime;
    return joinTime;
  }

  getConnectStatus(networkId) {
    var status = this.easyrtc.getConnectStatus(networkId);

    if (status == this.easyrtc.IS_CONNECTED) {
      return NetworkInterface.IS_CONNECTED;
    } else if (status == this.easyrtc.NOT_CONNECTED) {
      return NetworkInterface.NOT_CONNECTED;
    } else {
      return NetworkInterface.CONNECTING;
    }
  }
}

module.exports = EasyRtcInterface;

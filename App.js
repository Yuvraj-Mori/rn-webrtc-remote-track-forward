//106.0.1
//=========

import React, { useRef } from 'react';

import {
  Button,
  KeyboardAvoidingView,
  SafeAreaView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStream,
  mediaDevices,
} from 'react-native-webrtc';
import { useState, useEffect } from 'react';

import firestore from '@react-native-firebase/firestore';

const App = () => {
  const [remoteStream, setRemoteStream] = useState(null);
  const [remoteAudio, setRemoteAudio] = useState(null);
  const [webcamStarted, setWebcamStarted] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [channelId, setChannelId] = useState("DU5K9cLzIsnl1fOE3eBM");

  const pc = useRef();
  const servers = {
    iceServers: [
      {
        urls: [
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
        ],
      },
    ],
    iceCandidatePoolSize: 10,
  };



  const startWebcam = async () => {
    pc.current = new RTCPeerConnection(servers);
    const local = await mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    if (!local) {
      console.log("Local Track is null");
      return;
    }

    local.getTracks().forEach(_track => {
      pc.current.addTrack(_track, local);
    })
    setLocalStream(local);
    const remote = new MediaStream();
    setRemoteStream(remote);

    // Pull tracks from remote stream, add to video stream
    pc.current.ontrack = event => {
      console.log("Remote Track Received", event.track);
      event.streams[0].getTracks().forEach(track => {
        if (remoteStream)
          remoteStream.addTrack(track);
        else {
          let newRemoteStream = new MediaStream();
          newRemoteStream.addTrack(track)
          setRemoteStream(newRemoteStream);
        }
        if (track.kind == "audio") setRemoteAudio(track);
      });
    };

    // pc.current.onaddstream = event => {
    //   setRemoteStream(event.stream);
    // };

    setWebcamStarted(true);
  };

  const startCall = async () => {
    const channelDoc = firestore().collection('channels').doc();
    const offerCandidates = channelDoc.collection('offerCandidates');
    const answerCandidates = channelDoc.collection('answerCandidates');

    setChannelId(channelDoc.id);

    pc.current.onicecandidate = async event => {
      if (event.candidate) {
        await offerCandidates.add(event.candidate.toJSON());
      }
    };

    //create offer
    const offerDescription = await pc.current.createOffer();
    await pc.current.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await channelDoc.set({ offer });

    // Listen for remote answer
    channelDoc.onSnapshot(snapshot => {
      const data = snapshot.data();
      if (!pc.current.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.current.setRemoteDescription(answerDescription);
      }
    });

    // When answered, add candidate to peer connection
    answerCandidates.onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          pc.current.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  };

  const joinCall = async () => {
    const channelDoc = firestore().collection('channels').doc(channelId);
    const offerCandidates = channelDoc.collection('offerCandidates');
    const answerCandidates = channelDoc.collection('answerCandidates');

    pc.current.onicecandidate = async event => {
      if (event.candidate) {
        await answerCandidates.add(event.candidate.toJSON());
      }
    };

    const channelDocument = await channelDoc.get();
    const channelData = channelDocument.data();

    const offerDescription = channelData.offer;

    await pc.current.setRemoteDescription(
      new RTCSessionDescription(offerDescription),
    );

    const answerDescription = await pc.current.createAnswer();
    await pc.current.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    await channelDoc.update({ answer });

    offerCandidates.onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          pc.current.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  };

  const forwardTrack = async () => {
    console.log("forwardTrack Init Complete");

    if (!(pc.current && remoteAudio)) {
      console.log("forwardTrack Process Terminate");

      return;
    }


    pc.current.addTrack(remoteAudio);

    console.log("forwardTrack Process Complete");

  }

  return (
    <KeyboardAvoidingView style={styles.body} behavior="position">
      <SafeAreaView>
        <View style={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
          {localStream && (
            <RTCView
              streamURL={localStream?.toURL()}
              style={styles.stream}
              objectFit="cover"
              mirror
            />
          )}

          {remoteStream && remoteStream.getVideoTracks().length > 0 && (
            <RTCView
              streamURL={remoteStream?.toURL()}
              style={styles.stream}
              objectFit="cover"
              mirror
            />
          )}
        </View>
        <View style={[styles.buttons, { alignItems: "center" }]}>
          {!webcamStarted && (
            <Button title="Start webcam" onPress={startWebcam} />
          )}
          {webcamStarted && <Button title="Start call" onPress={startCall} />}
          {webcamStarted && (
            <View style={{ flexDirection: 'row', marginVertical: 10, alignSelf: "stretch", justifyContent: "space-between" }}>
              <Button title="Join call" onPress={joinCall} />
              <TextInput
                value={channelId}
                placeholder="callId"
                minLength={45}
                style={{ borderWidth: 1, padding: 5 }}
                onChangeText={newText => setChannelId(newText)}
              />
            </View>
          )}
          {
            webcamStarted && remoteStream && remoteAudio &&
            <View style={{ alignSelf: "center" }}>
              <Button onPress={forwardTrack} title="Forward Remote Audio" color={"red"} onPress={forwardTrack} />
            </View>
          }
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  body: {
    backgroundColor: '#fff',

    justifyContent: 'center',
    alignItems: 'center',
    ...StyleSheet.absoluteFill,
  },
  stream: {
    width: 200,
    height: 200,
  },
  buttons: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    marginHorizontal: 15,
    marginTop: 10
  },
});

export default App;

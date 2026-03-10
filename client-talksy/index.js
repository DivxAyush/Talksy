import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately

//   MONGO_URL=mongodb://talksy:Ayush2133akka%24@ac-qtkzs5w-shard-00-00.kidoizp.mongodb.net:27017,ac-qtkzs5w-shard-00-01.kidoizp.mongodb.net:27017,ac-qtkzs5w-shard-00-02.kidoizp.mongodb.net:27017/?ssl=true&replicaSet=atlas-ztqr1v-shard-0&authSource=admin&appName=GoGrocer


registerRootComponent(App);

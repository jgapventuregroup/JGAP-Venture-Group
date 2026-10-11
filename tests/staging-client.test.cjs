const test = require('node:test');
const assert = require('node:assert/strict');
const {STAGING_URL,createStagingClient} = require('../staging-client.js');
test('staging client uses isolated project and nonpersistent session', () => {
  let captured;
  const client = createStagingClient({createClient:(...args)=>{captured=args;return {staging:true};}},'sb_publishable_test');
  assert.equal(client.staging,true);
  assert.equal(captured[0],STAGING_URL);
  assert.equal(captured[0],'https://qfszapteuxuogoselprp.supabase.co');
  assert.equal(captured[1],'sb_publishable_test');
  assert.equal(captured[2].auth.persistSession,false);
  assert.equal(captured[2].auth.autoRefreshToken,false);
  assert.equal(captured[2].auth.detectSessionInUrl,false);
  assert.equal(captured[2].auth.storageKey,'jgap-staging-auth-v1');
});
test('staging client rejects missing or privileged keys without connecting', () => {
  let calls=0;
  const lib={createClient:()=>{calls++;return {};}};
  for(const key of ['', '  ', 'sb_secret_test', 'service_role', 'aaa.bbb.ccc',null]){
    assert.throws(()=>createStagingClient(lib,key),/publishable key/);
  }
  assert.equal(calls,0);
});

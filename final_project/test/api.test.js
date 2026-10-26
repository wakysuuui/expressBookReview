const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../index');
const methods = require('../router/general');
test('REST, Axios, sessions and isolation between reviewers', async t => {
  const server = app.listen(0,'127.0.0.1');
  await new Promise(resolve => server.once('listening',resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = 'http://127.0.0.1:'+server.address().port;
  async function request(route,method='GET',body,cookie) {
    const response = await fetch(base+route,{ method, headers:{
      ...(body ? {'Content-Type':'application/json'} : {}),
      ...(cookie ? {Cookie:cookie} : {})
    },body:body ? JSON.stringify(body) : undefined });
    return { status:response.status, data:await response.json(), cookie:response.headers.get('set-cookie')?.split(';')[0] };
  }
  const books = await methods.getAllBooks(base);
  const isbn = Object.keys(books)[0];
  assert.ok(isbn,'Use the original booksdb.js');
  const url = '/customer/auth/review/'+encodeURIComponent(isbn);
  assert.equal((await request(url,'PUT',{review:'no auth'})).status,401);
  const accounts = await Promise.all(['reviewerA','reviewerB'].map(async username => {
    const body = {username,password:'testpassword123'};
    assert.equal((await request('/register','POST',body)).status,201);
    return (await request('/customer/login','POST',body)).cookie;
  }));
  assert.equal((await request('/customer/login','POST',{username:'reviewerA',password:'wrongpassword'})).status,401);
  await Promise.all(accounts.map((cookie,i) => request(url,'PUT',{review:'review '+i},cookie)));
  await request(url,'PUT',{review:'updated',username:'reviewerB'},accounts[0]);
  let reviews = (await request('/review/'+isbn)).data;
  assert.equal(reviews.reviewerA,'updated');
  assert.equal(reviews.reviewerB,'review 1');
  await request(url,'DELETE',undefined,accounts[0]);
  reviews = (await request('/review/'+isbn)).data;
  assert.equal(Object.hasOwn(reviews,'reviewerA'),false);
  assert.equal(reviews.reviewerB,'review 1');
  assert.equal((await request(url,'DELETE',undefined,accounts[0])).status,404);
  await request(url,'DELETE',undefined,accounts[1]);
  const [byISBN,byAuthor,byTitle] = await Promise.all([
    methods.getBooksByISBN(isbn,base),methods.getBooksByAuthor(books[isbn].author,base),
    methods.getBooksByTitle(books[isbn].title,base)
  ]);
  assert.equal(byISBN.title,books[isbn].title);
  assert.ok(byAuthor[isbn]); assert.ok(byTitle[isbn]);
});

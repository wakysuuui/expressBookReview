const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { mkdir, writeFile, rm } = require('node:fs/promises');
const path = require('node:path');
const run = promisify(execFile);
const base = process.env.BOOK_API_URL || 'http://127.0.0.1:5000';
const out = path.resolve('submission');
const cookie = path.join(out,'session.cookies');
const curl = process.platform === 'win32' ? 'curl.exe' : 'curl';
async function capture(name,args,expected) {
  const full = ['--silent','--show-error','--fail-with-body',...args];
  const { stdout } = await run(curl,full,{ maxBuffer:10*1024*1024 });
  const data = JSON.parse(stdout);
  if (expected && !expected(data)) throw new Error('Unexpected response for '+name);
  const command = 'curl '+full.map(a => JSON.stringify(a)).join(' ');
  await writeFile(path.join(out,name+'.txt'),command+'\n\n'+stdout+'\n');
  console.log('Saved '+name);
  return data;
}
async function main() {
  await mkdir(out,{ recursive:true });
  const books = await capture('getallbooks',[base+'/']);
  const isbn = Object.keys(books)[0];
  if (!isbn) throw new Error('No books found');
  const book = books[isbn];
  await capture('getbooksbyISBN',[base+'/isbn/'+encodeURIComponent(isbn)]);
  await capture('getbooksbyauthor',[base+'/author/'+encodeURIComponent(book.author)]);
  await capture('getbooksbytitle',[base+'/title/'+encodeURIComponent(book.title)]);
  await capture('getbookreview',[base+'/review/'+encodeURIComponent(isbn)]);
  const username = 'student_'+Date.now();
  const form = ['--data-urlencode','username='+username,'--data-urlencode','password=DemoPass12345'];
  await capture('register',['-X','POST',...form,base+'/register'],d => d.username === username);
  await capture('login',['-c',cookie,'-X','POST',...form,base+'/customer/login'],d => d.username === username);
  const url = base+'/customer/auth/review/'+encodeURIComponent(isbn);
  await capture('reviewadded',['-b',cookie,'-X','PUT','--data-urlencode','review=An excellent book.',url],d => d.reviews[username] === 'An excellent book.');
  await capture('reviewmodified',['-b',cookie,'-X','PUT','--data-urlencode','review=Updated: highly recommended.',url],d => d.message === 'Review updated');
  await capture('deletereview',['-b',cookie,'-X','DELETE',url],d => d.message === 'Review deleted');
  const methods = require('../router/general');
  await Promise.all([
    methods.getAllBooks(base),methods.getBooksByISBN(isbn,base),
    methods.getBooksByAuthor(book.author,base),methods.getBooksByTitle(book.title,base)
  ]);
  console.log('All four Axios methods completed concurrently.');
  const repo = process.argv[2];
  if (!repo) {
    console.log('Task 11 pending: rerun with npm run evidence -- YOUR_USERNAME/expressBookReviews');
    return;
  }
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error('Use OWNER/REPOSITORY');
  await capture('githubrepo',['-H','Accept: application/vnd.github+json','https://api.github.com/repos/'+repo],
    d => d.fork === true && ['ibm-developer-skills-network/expressBookReviews','ibm-developer-skills-network/expressBookReview'].includes(d.parent?.full_name));
  const { stdout } = await run(curl,['--silent','--show-error','--fail','https://api.github.com/repos/'+repo]);
  const metadata = JSON.parse(stdout);
  await writeFile(path.join(out,'generaljs-url.txt'),'https://github.com/'+repo+'/blob/'+metadata.default_branch+'/final_project/router/general.js\n');
}
main().catch(err => { console.error(err.message); process.exitCode = 1; }).finally(() => rm(cookie,{ force:true }));

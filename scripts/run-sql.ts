import * as fs from 'fs';
import * as path from 'path';

const sqlFile = process.argv[2];

if (!sqlFile) {
  console.error('❌ Please provide SQL file path');
  console.log('Usage: tsx scripts/run-sql.ts <path-to-sql>');
  process.exit(1);
}

const fullPath = path.join(process.cwd(), sqlFile);

if (!fs.existsSync(fullPath)) {
  console.error(`❌ File not found: ${fullPath}`);
  process.exit(1);
}

const sqlContent = fs.readFileSync(fullPath, 'utf-8');

console.log('📄 SQL file content:\n');
console.log('─'.repeat(80));
console.log(sqlContent);
console.log('─'.repeat(80));
console.log('\n💡 Please run this SQL in your Supabase SQL Editor:');
console.log(`   https://supabase.com/dashboard/project/${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}/sql`);

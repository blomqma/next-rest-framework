import { getTodos } from '@/actions';
import { Footer } from '@/app/components/Footer';
import { Navbar } from '@/app/components/Navbar';
import { ClientExample } from '@/app/client/ClientExample';

export default async function Page() {
  const todos = await getTodos();

  return (
    <>
      <Navbar />
      <main className="max-w-7xl grow w-full flex flex-col justify-center gap-4 p-4">
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-bold">RPC server-side client example</h1>
          <p>Data:</p>
          <p>{JSON.stringify(todos)}</p>
        </div>
        <ClientExample />
      </main>
      <Footer />
    </>
  );
}

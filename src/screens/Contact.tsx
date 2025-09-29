export default function Contact() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Contact Us</h1>
      <div className="grid md:grid-cols-2 gap-12">
        <div>
          <h2 className="text-xl font-semibold mb-4">Get in Touch</h2>
          <div className="space-y-4">
            <div>
              <strong>Phone:</strong> +1-587-742-8885
            </div>
            <div>
              <strong>Email:</strong> info@tradeline247ai.com
            </div>
            <div>
              <strong>Address:</strong><br/>
              Apex Business Systems<br/>
              Edmonton, Alberta, Canada
            </div>
          </div>
        </div>
        <div>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input type="text" className="w-full p-3 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" className="w-full p-3 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input type="tel" className="w-full p-3 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Message</label>
              <textarea rows={4} className="w-full p-3 border rounded-lg" required></textarea>
            </div>
            <button type="submit" className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium">
              Send Message
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
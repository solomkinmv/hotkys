export default function Page() {
  return (
    <div className="bg-white p-4">
      <div className="text-3xl font-bold mb-6">Shortcuts Disco</div>
      <p className="text-gray-700 mb-4">
        Shortcuts database for different applications.
      </p>
      <p className="text-gray-700 mb-8">
        Note: currently support only macOS. Please vote for this feature <a href="#"
                                                                            className="text-blue-600 hover:underline">here</a>
      </p>
      <div className="font-bold text-3xl mb-4">Contribution</div>
      <p className="text-gray-700 mb-4">
        Create PR with shortcuts in <span className="font-mono bg-gray-200 p-1 rounded">shortcuts-data</span> on GitHub.
      </p>
      <p className="text-gray-700 mb-4">
        Include schema for each application <span className="font-mono bg-gray-200 p-1 rounded">"$schema": "schema/shortcut.schema.json"</span> as
        a first JSON property.
      </p>
      <a href="#" className="text-blue-600 hover:underline">See full contribution guide on GitHub</a>
    </div>
  );
}

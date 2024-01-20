import { Space } from "antd";
import Link from "next/link";

const Page = () => (
  <div>
    <Space direction="vertical">
      <h1>Shortcuts Disco</h1>
      <div>Shortcuts database for different applications.</div>
      <div>Note: currently support only macOs. Please vote for this feature <Link
        href="https://github.com/solomkinmv/shortcuts-disco/issues/2" target="_blank">here</Link></div>
      <h3>Contribution</h3>
      <div>Create PR with shortcuts in <span>shortcuts-data</span> on <Link
        href="https://github.com/solomkinmv/shortcuts-disco/tree/main/shortcuts-site/shortcuts-data"
        target="_blank">GitHub</Link>.
      </div>
      <div>Include schema for each application <span>"$schema": "schema/shortcut.schema.json"</span> as a first
        JSON
        property.
      </div>
      <div>See full contribution guide on <Link href="https://github.com/solomkinmv/shortcuts-disco"
                                                target="_blank">GitHub</Link></div>
    </Space>
  </div>
);

export default Page;

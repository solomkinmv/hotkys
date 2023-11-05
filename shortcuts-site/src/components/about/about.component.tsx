import { Space, Typography } from 'antd';

const {Title, Text, Link} = Typography;

export default function About() {
    return (
        <div>
            <Space direction="vertical">
                <Title>Shortcuts Disco</Title>
                <Text>Shortcuts database for different applications.</Text>
                <Text>Note: currently support only macOs. Please vote for this feature <Link
                    href="https://github.com/solomkinmv/shortcuts-disco/issues/2" target="_blank">here</Link></Text>
                <Title level={3}>Contribution</Title>
                <Text>Create PR with shortcuts in <Text code>shortcuts-data</Text> on <Link href="https://github.com/solomkinmv/shortcuts-disco/tree/main/shortcuts-site/shortcuts-data"
                                                        target="_blank">GitHub</Link>.</Text>
                <Text>Include schema for each application <Text code>"$schema": "schema/shortcut.schema.json"</Text> as a first JSON
                    property.</Text>
                <Text>See full contribution guide on <Link href="https://github.com/solomkinmv/shortcuts-disco" target="_blank">GitHub</Link></Text>
            </Space>
        </div>
    );
}

import Link from "next/link";
import {Separator} from "@/components/ui/separator";

export default function NotFound({params}: { params: { slug: string } }) {
    const slug = params.slug;
    const clarificationBlock = slug ? (
        <div>
            Selected bundleId <kbd>{slug}</kbd> does not exist in the database.
        </div>
    ) : null;

    return (
        <div>
            <h1>Oops! Application not found</h1>
            {clarificationBlock}
            <Separator/>
            <Link href="/">All supported applications</Link>
        </div>
    )
}

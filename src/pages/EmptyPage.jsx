import Icon from '../components/Icon'
import { PageHeading } from '../components/UI'

export default function EmptyPage({ title, section }) {
  return <>
    <PageHeading eyebrow={section.toUpperCase()} title={title} description="This page is ready for your content." />
    <section className="panel flex min-h-[420px] flex-col items-center justify-center px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf2f9] text-[#53719e]"><Icon name="box" size={25} /></span>
      <h2 className="mt-5 text-sm font-semibold text-[#172b46]">No content yet</h2>
      <p className="mt-2 max-w-sm text-xs leading-5 text-slate-400">Content and management tools will appear here once they are added.</p>
    </section>
  </>
}

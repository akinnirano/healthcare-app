export default function Banner({title, radius}) {
  return (
    <div className="bg-blue-600 text-white text-center py-20 mb-10" style={{borderRadius: radius}}>
      <h1 className="text-4xl font-bold">{title}</h1>
      <p className="mt-4 max-w-2xl mx-auto">Streamline staff assignments, timesheets, payroll, compliance, and visits.</p>
    </div>
  )
}

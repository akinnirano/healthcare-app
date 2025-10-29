export default function Card({title, description}) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm">{description}</p>
    </div>
  )
}

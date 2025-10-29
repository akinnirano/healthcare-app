export default function StatCard({ title, value, color }) {
  return (
    <div className={`p-4 bg-${color}-100 rounded-xl shadow-sm`}>
      <h2 className="text-sm font-medium text-gray-500">{title}</h2>
      <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
    </div>
  );
}

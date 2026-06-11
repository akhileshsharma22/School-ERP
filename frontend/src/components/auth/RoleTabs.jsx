import { ROLES } from "../../constants/roles";

const RoleTabs = ({ role, setRole }) => {
  const tabs = [
    ROLES.PARENT,
    ROLES.STAFF,
    ROLES.ADMIN,
  ];

  return (
    <div className="grid grid-cols-3 gap-2 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setRole(tab)}
          className={`py-2 rounded-lg font-medium transition-all
          ${
            role === tab
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default RoleTabs;
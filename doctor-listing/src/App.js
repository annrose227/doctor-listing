import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const SearchBar = ({
  searchTerm,
  handleSearch,
  handleSearchSubmit,
  suggestions,
  handleSuggestionClick,
}) => (
  <div className="w-full p-4 bg-blue-600">
    <input
      type="text"
      placeholder="Search Symptoms, Doctors, Specialities, Clinics"
      value={searchTerm}
      onChange={(e) => handleSearch(e.target.value)}
      onKeyDown={handleSearchSubmit}
      className="w-full p-2 rounded"
      data-testid="autocomplete-input"
    />
    {suggestions.length > 0 && (
      <ul className="absolute bg-white border rounded w-1/2 mt-1">
        {suggestions.map((doctor, index) => (
          <li
            key={index}
            className="p-2 hover:bg-gray-200 cursor-pointer"
            onClick={() => handleSuggestionClick(doctor.name)}
            data-testid="suggestion-item"
          >
            {doctor.name}
          </li>
        ))}
      </ul>
    )}
  </div>
);

const FilterPanel = ({
  sortBy,
  handleSortChange,
  consultationMode,
  handleConsultationModeChange,
  specialties,
  handleSpecialtyChange,
  allSpecialties,
}) => (
  <div className="w-1/4 p-4 bg-white shadow">
    <div>
      <h3 data-testid="filter-header-sort" className="font-bold">
        Sort by
      </h3>
      <label>
        <input
          type="radio"
          name="sort"
          value="fees"
          checked={sortBy === "fees"}
          onChange={() => handleSortChange("fees")}
          data-testid="sort-fees"
        />
        Price: Low-High
      </label>
      <label>
        <input
          type="radio"
          name="sort"
          value="experience"
          checked={sortBy === "experience"}
          onChange={() => handleSortChange("experience")}
          data-testid="sort-experience"
        />
        Experience: Most Experience first
      </label>
    </div>

    <div className="mt-4">
      <h3 data-testid="filter-header-moc" className="font-bold">
        Mode of Consultation
      </h3>
      <label>
        <input
          type="radio"
          name="consultationMode"
          value="video-consult"
          checked={consultationMode === "video-consult"}
          onChange={() => handleConsultationModeChange("video-consult")}
          data-testid="filter-video-consult"
        />
        Video Consultation
      </label>
      <label>
        <input
          type="radio"
          name="consultationMode"
          value="in-clinic"
          checked={consultationMode === "in-clinic"}
          onChange={() => handleConsultationModeChange("in-clinic")}
          data-testid="filter-in-clinic"
        />
        In-clinic Consultation
      </label>
    </div>

    <div className="mt-4">
      <h3 data-testid="filter-header-speciality" className="font-bold">
        Specialities
      </h3>
      {allSpecialties.map((specialty) => (
        <label key={specialty}>
          <input
            type="checkbox"
            checked={specialties.includes(specialty)}
            onChange={() => handleSpecialtyChange(specialty)}
            data-testid={`filter-specialty-${specialty.replace(/\//g, "-")}`}
          />
          {specialty}
        </label>
      ))}
    </div>
  </div>
);

const DoctorCard = ({ doctor }) => (
  <div
    className="p-4 mb-4 bg-white shadow rounded flex justify-between items-center"
    data-testid="doctor-card"
  >
    <div>
      <h3 data-testid="doctor-name" className="font-bold">
        {doctor.name}
      </h3>
      <p data-testid="doctor-specialty">{doctor.specialties.join(", ")}</p>
      <p data-testid="doctor-experience">{doctor.yearsOfExperience} yrs exp.</p>
      <p>
        {doctor.clinicName}, {doctor.city}
      </p>
    </div>
    <div>
      <p data-testid="doctor-fee">₹{doctor.consultationFee}</p>
      <button className="bg-blue-500 text-white px-4 py-2 rounded">
        Book Appointment
      </button>
    </div>
  </div>
);

const App = () => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [consultationMode, setConsultationMode] = useState("");
  const [specialties, setSpecialties] = useState([]);
  const [sortBy, setSortBy] = useState("");

  useEffect(() => {
    axios
      .get("https://srijandubey.github.io/campus-api-mock/SRM-C1-25.json")
      .then((response) => {
        setDoctors(response.data);
        setFilteredDoctors(response.data);
        const params = new URLSearchParams(window.location.search);
        const mode = params.get("consultationMode") || "";
        const specs = params.get("specialties")
          ? params.get("specialties").split(",")
          : [];
        const sort = params.get("sortBy") || "";
        setConsultationMode(mode);
        setSpecialties(specs);
        setSortBy(sort);
        applyFilters(response.data, mode, specs, sort, searchTerm);
      })
      .catch((error) => console.error("Error fetching doctors:", error));

    window.addEventListener("popstate", () => {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get("consultationMode") || "";
      const specs = params.get("specialties")
        ? params.get("specialties").split(",")
        : [];
      const sort = params.get("sortBy") || "";
      const search = params.get("search") || "";
      setConsultationMode(mode);
      setSpecialties(specs);
      setSortBy(sort);
      setSearchTerm(search);
      applyFilters(doctors, mode, specs, sort, search);
    });
  }, []);

  const applyFilters = (doctorsList, mode, specs, sort, search) => {
    let filtered = [...doctorsList];

    if (search) {
      filtered = filtered.filter((doctor) =>
        doctor.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (mode) {
      filtered = filtered.filter((doctor) =>
        mode === "video-consult" ? doctor.videoConsultAvailable : true
      );
    }

    if (specs.length > 0) {
      filtered = filtered.filter((doctor) =>
        specs.some((spec) => doctor.specialties.includes(spec))
      );
    }

    if (sort) {
      filtered.sort((a, b) => {
        if (sort === "fees") return a.consultationFee - b.consultationFee;
        if (sort === "experience")
          return b.yearsOfExperience - a.yearsOfExperience;
        return 0;
      });
    }

    setFilteredDoctors(filtered);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (mode) params.set("consultationMode", mode);
    if (specs.length > 0) params.set("specialties", specs.join(","));
    if (sort) params.set("sortBy", sort);
    window.history.pushState(
      {},
      "",
      `${window.location.pathname}?${params.toString()}`
    );
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (value) {
      const matches = doctors
        .filter((doctor) =>
          doctor.name.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 3);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (name) => {
    setSearchTerm(name);
    setSuggestions([]);
    applyFilters(doctors, consultationMode, specialties, sortBy, name);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter") {
      setSuggestions([]);
      applyFilters(doctors, consultationMode, specialties, sortBy, searchTerm);
    }
  };

  const handleConsultationModeChange = (mode) => {
    setConsultationMode(mode);
    applyFilters(doctors, mode, specialties, sortBy, searchTerm);
  };

  const handleSpecialtyChange = (specialty) => {
    const updatedSpecialties = specialties.includes(specialty)
      ? specialties.filter((s) => s !== specialty)
      : [...specialties, specialty];
    setSpecialties(updatedSpecialties);
    applyFilters(
      doctors,
      consultationMode,
      updatedSpecialties,
      sortBy,
      searchTerm
    );
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    applyFilters(doctors, consultationMode, specialties, sort, searchTerm);
  };

  const allSpecialties = [
    ...new Set(doctors.flatMap((doctor) => doctor.specialties)),
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <SearchBar
        searchTerm={searchTerm}
        handleSearch={handleSearch}
        handleSearchSubmit={handleSearchSubmit}
        suggestions={suggestions}
        handleSuggestionClick={handleSuggestionClick}
      />
      <div className="flex flex-1">
        <FilterPanel
          sortBy={sortBy}
          handleSortChange={handleSortChange}
          consultationMode={consultationMode}
          handleConsultationModeChange={handleConsultationModeChange}
          specialties={specialties}
          handleSpecialtyChange={handleSpecialtyChange}
          allSpecialties={allSpecialties}
        />
        <div className="w-3/4 p-4">
          {filteredDoctors.map((doctor) => (
            <DoctorCard key={doctor.name} doctor={doctor} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;

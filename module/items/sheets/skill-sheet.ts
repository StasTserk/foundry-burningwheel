export class SkillSheet extends ItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {});
    }

    get template() {
        return "systems/burningwheel/templates/items/skill.html";
    }

    getData() {
        const data = super.getData() as SkillSheetData;
        data.skillTypes = {
            academic: "Academic",
            artisan: "Artisan",
            artist: "Artist",
            craftsman: "Craftsman",
            forester: "Forester",
            martial: "Martial",
            medicinal: "Medicinal",
            military: "Military",
            musical: "Musical",
            peasant: "Peasant",
            physical: "Physical",
            schoolofthought: "School of Thought",
            seafaring: "Seafaring",
            special: "Special",
            social: "Social",
            sorcerous: "Sorcerous",
            training: "Training"
        }

        data.skillRoots = {
            power: "Power",
            agility: "Agility",
            will: "Will",
            perception: "Perception",
            forte: "Forte",
            speed: "Speed",
        }
        return data;
    }
}

interface SkillSheetData extends ItemSheetData {
    skillTypes: { [index: string]: string };
    skillRoots: { [index: string]: string };
}
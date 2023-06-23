/**
 * A singleton Collection of Compendium-level Document objects within the Foundry Virtual Tabletop.
 * Each Compendium pack has its own associated instance of the CompendiumCollection class which contains its contents.
 */
declare class CompendiumCollection<
    T extends FoundryDocument = FoundryDocument
> extends DocumentCollection<T> {
    /**
     * The amount of time that Document instances within this CompendiumCollection are held in memory.
     * Accessing the contents of the Compendium pack extends the duration of this lifetime.
     * @type {number}
     */
    static CACHE_LIFETIME_SECONDS: number;
    /**
     * The named game setting which contains Compendium configurations.
     * @type {string}
     */
    static CONFIG_SETTING: string;
    /**
     * Create a new Compendium Collection using provided metadata.
     * @param {object} metadata   The compendium metadata used to create the new pack
     * @param {object} options   Additional options which modify the Compendium creation request
     * @return {Promise<CompendiumCollection>}
     */
    static createCompendium<T extends FoundryDocument>(
        metadata: unknown,
        options?: unknown
    ): Promise<CompendiumCollection<T>>;
    constructor(metadata: unknown);
    /**
     * The compendium metadata which defines the compendium content and location
     * @type {unknown}
     */
    metadata: unknown;
    /**
     * The canonical Compendium name - comprised of the originating package and the pack name
     * @type {string}
     */
    get collection(): string;
    /**
     * Access the compendium configuration data for this pack
     * @type {object}
     */
    get config(): unknown;
    /** @inheritdoc */
    get documentName(): string;
    /**
     * Track whether the Compendium Collection is locked for editing
     * @type {boolean}
     */
    get locked(): boolean;
    /**
     * Track whether the Compendium Collection is private
     * @type {boolean}
     */
    get private(): boolean;
    /**
     * A convenience reference to the label which should be used as the title for the Compendium pack.
     * @type {string}
     */
    get title(): string;
    /** @inheritdoc */
    get(
        key: string,
        options?: { strict: boolean } = { strict: false }
    ): FoundryDocument | undefined;
    /** @inheritdoc */
    set(id: string, document: FoundryDocument): unknown;
    /** @inheritdoc */
    delete(id: string): unknown;
    /**
     * Load the Compendium index and cache it as the keys and values of the Collection.
     * @returns {Promise<Collection>}
     */
    getIndex(): Promise<Collection>;
    /**
     * Get a single Document from this Compendium by ID.
     * The document may already be locally cached, otherwise it is retrieved from the server.
     * @param {string} id               The requested Document id
     * @returns {Promise<FoundryDocument>}     The retrieved Document instance
     */
    getDocument(id: string): Promise<FoundryDocument>;
    /**
     * Load multiple documents from the Compendium pack using a provided query object.
     * @param {object} query            A database query used to retrieve documents from the underlying database
     * @returns {Promise<FoundryDocument[]>}   The retrieved Document instances
     */
    getDocuments(query?: unknown): Promise<FoundryDocument[]>;
    /**
     * Import a Document into this Compendium Collection.
     * @param {Document} document     The existing Document you wish to import
     * @return {Promise<FoundryDocument>}   The imported Document instance
     */
    importDocument(document: FoundryDocument): Promise<FoundryDocument>;
    /**
     * Fully import the contents of a Compendium pack into a World folder.
     * @param {string|null} [folderId]  An existing Folder _id to use.
     * @param {string} [folderName]     A new Folder name to create.
     * @return {Promise<FoundryDocument[]>}    The imported Documents, now existing within the World
     */
    importAll({
        folderId,
        folderName,
    }?: string | null): Promise<FoundryDocument[]>;
    /**
     * Add a Document to the index, capturing it's relevant index attributes
     * @param {FoundryDocument} document       The document to index
     */
    indexDocument(document: FoundryDocument): void;
    /**
     * Assign configuration metadata settings to the compendium pack
     * @param {unknown} settings   The object of compendium settings to define
     * @return {Promise}          A Promise which resolves once the setting is updated
     */
    configure(settings?: unknown): Promise<unknown>;
    /**
     * Delete an existing world-level Compendium Collection.
     * This action may only be performed for world-level packs by a Gamemaster User.
     * @return {Promise<CompendiumCollection>}
     */
    deleteCompendium(): Promise<CompendiumCollection>;
    /**
     * Duplicate a compendium pack to the current World.
     * @param {string} label    A new Compendium label
     * @return {Promise<CompendiumCollection>}
     */
    duplicateCompendium({ label }?: string): Promise<CompendiumCollection>;
    /**
     * Validate that the current user is able to modify content of this Compendium pack
     * @return {boolean}
     * @private
     */
    private _assertUserCanModify;
    /**
     * Request that a Compendium pack be migrated to the latest System data template
     * @return {Promise<CompendiumCollection>}
     */
    migrate(options: unknown): Promise<CompendiumCollection>;
    /** @inheritdoc */
    _onCreateDocuments(
        documents: FoundryDocument[],
        result: FoundryDocument[],
        options: unknown,
        userId: string
    ): void;
    /** @inheritdoc */
    _onUpdateDocuments(
        documents: FoundryDocument[],
        result: FoundryDocument[],
        options: unknown,
        userId: string
    ): void;
    /** @inheritdoc */
    _onDeleteDocuments(
        documents: FoundryDocument[],
        result: FoundryDocument[],
        options: unknown,
        userId: string
    ): void;
    /**
     * Follow-up actions taken when Documents within this Compendium pack are modified
     * @private
     */
    private _onModifyContents;
    /**
     * @deprecated since 0.9.0
     * @ignore
     */
    get entity(): any;
    /**
     * @deprecated since 0.9.0
     * @ignore
     */
    getContent(): Promise<FoundryDocument[]>;
    /**
     * @deprecated since 0.9.0
     * @ignore
     */
    getEntry(id: string): Promise<FoundryDocument>;
    /**
     * @deprecated since 0.9.0
     * @ignore
     */
    getEntity(id: string): Promise<FoundryDocument>;
    /**
     * @deprecated since 0.9.0
     * @ignore
     */
    importEntity(document: any): Promise<FoundryDocument>;
    /**
     * @deprecated since 0.9.0
     * @ignore
     */
    createEntity(data: any, options?: {}): Promise<any>;
    /**
     * @deprecated since 0.9.0
     * @ignore
     */
    updateEntity(data: any, options?: {}): Promise<any>;
    /**
     * @deprecated since 0.9.0
     * @ignore
     */
    deleteEntity(id: any, options?: {}): Promise<any>;
}

import { PrismaClient, UserRole, PolicyTypeEnum, PolicyStatus, Company, ApplicationStatus, SupportTicketStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seeding...');

    // 1. Clean existing data
    await prisma.policyPayment.deleteMany();
    await prisma.policyCoverage.deleteMany();
    await prisma.policyDocument.deleteMany();
    await prisma.policy.deleteMany();
    await prisma.employeeDocument.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.department.deleteMany();
    await prisma.corporatePolicy.deleteMany();
    await prisma.applicationUpdate.deleteMany();
    await prisma.applicationDocument.deleteMany();
    await prisma.application.deleteMany();
    await prisma.insurancePackage.deleteMany();
    await prisma.carrier.deleteMany();
    await prisma.supportTicket.deleteMany();
    await prisma.company.deleteMany();
    await prisma.activity.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.policyType.deleteMany();
    await prisma.tenant.deleteMany();

    console.log('🧹 Cleaned database');

    // 2. Create Tenant + Users
    const tenantId = '11111111-1111-1111-1111-111111111111';
    const tenant = await prisma.tenant.upsert({
        where: { id: tenantId },
        update: {},
        create: {
            id: tenantId,
            name: 'Agito Sigorta',
            domain: 'agito.com',
        },
    });

    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.user.createMany({
        data: [
            { email: 'admin@agito.com', passwordHash, role: UserRole.ADMIN, tenantId: tenant.id, name: 'Admin User' },
            { email: 'ops@agito.com', passwordHash, role: UserRole.HR_MANAGER, tenantId: tenant.id, name: 'Ops User' },
            { email: 'viewer@agito.com', passwordHash, role: UserRole.EMPLOYEE, tenantId: tenant.id, name: 'Viewer User' },
        ],
    });

    console.log('👤 Created demo users');

    // 3. Create Carriers
    const carrierNames = ['Allianz', 'Axa Sigorta', 'Mapfre', 'Anadolu Sigorta', 'Acıbadem Sigorta'];
    const carriers: any[] = [];
    for (const name of carrierNames) {
        const carrier = await prisma.carrier.create({
            data: {
                name,
                code: name.substring(0, 3).toUpperCase(),
                logoUrl: `https://ui-avatars.com/api/?name=${name}&background=random`,
                isActive: true,
            }
        });
        carriers.push(carrier);
    }
    console.log(`🏥 Created ${carriers.length} carriers`);

    // 4. Create Insurance Packages
    const packages = [
        {
            name: 'Startup Kasko & Sağlık',
            tier: 'BRONZE',
            priceRange: '₺150.000 - ₺250.000',
            focus: 'Küçük ekipler için temel güvence',
            minEmployees: 5,
            highlights: ['TSS Teminatı', 'Diş Paketi', 'Yıllık Check-up'],
        },
        {
            name: 'Scale-Up Premium',
            tier: 'GOLD',
            priceRange: '₺500.000 - ₺1.000.000',
            focus: 'Büyüyen şirketler için kapsamlı çözüm',
            minEmployees: 20,
            highlights: ['ÖSS + TSS Hibrit', 'Yatarak Tedavi %100', 'Doğum Teminatı', 'Yurtdışı Seyahat'],
        },
        {
            name: 'Enterprise Exclusive',
            tier: 'PLATINUM',
            priceRange: '₺2.000.000+',
            focus: 'Holding ve büyük yapılar için özel tasarım',
            minEmployees: 100,
            highlights: ['VIP Sağlık Hizmeti', 'Aile Kapsamı', 'Özel Müşteri Temsilcisi', 'İleri Check-up'],
        },
    ];

    for (const pkg of packages) {
        await prisma.insurancePackage.create({
            data: {
                ...pkg,
                isActive: true,
                carriers: {
                    connect: carriers.slice(0, 3).map(c => ({ id: c.id })) // Connect first 3 carriers to all for demo
                }
            }
        });
    }
    console.log(`📦 Created ${packages.length} insurance packages`);


    // 5. Create Companies
    const companies: Company[] = [];
    for (let i = 0; i < 10; i++) {
        const company = await prisma.company.create({
            data: {
                name: faker.company.name(),
                taxId: faker.number.int({ min: 1000000000, max: 9999999999 }).toString(),
                address: faker.location.streetAddress(),
                city: faker.location.city(),
                tenantId: tenant.id,
                email: faker.internet.email(),
                phone: faker.phone.number(),
                website: faker.internet.url(),
                sector: faker.commerce.department(),
                employeeCount: faker.number.int({ min: 10, max: 200 }),
            },
        });
        companies.push(company);
    }
    console.log(`🏢 Created ${companies.length} companies`);

    // 6. Support Tickets
    const ticketCategories = ['Fatura İtirazı', 'Poliçe Detayı', 'Sistem Hatası', 'Kullanıcı Yetkisi'];
    for (let i = 0; i < 15; i++) {
        await prisma.supportTicket.create({
            data: {
                tenantId: tenant.id,
                subject: faker.hacker.phrase(),
                message: faker.lorem.paragraph(),
                category: faker.helpers.arrayElement(ticketCategories),
                status: faker.helpers.arrayElement(Object.values(SupportTicketStatus)),
                createdByEmail: 'admin@agito.com'
            }
        });
    }
    console.log(`🎫 Created 15 support tickets`);


    // 7. Applications
    for (let i = 0; i < 5; i++) {
        const pkg = await prisma.insurancePackage.findFirst();
        const carrier = await prisma.carrier.findFirst();
        const company = companies[i]; // Use first 5 companies

        await prisma.application.create({
            data: {
                tenantId: tenant.id,
                companyId: company.id,
                packageId: pkg?.id!,
                carrierId: carrier?.id,
                companyName: company.name,
                companyEmail: company.email || 'test@test.com',
                companyPhone: company.phone || '05555555555',
                employeeCount: company.employeeCount || 10,
                status: faker.helpers.arrayElement(Object.values(ApplicationStatus)),
                hasDocuments: true,
            }
        });
    }
    console.log(`📝 Created 5 applications`);


    // 8. Create Departments
    const departmentsByCompany = new Map<string, string[]>();
    let departmentCount = 0;

    for (const company of companies) {
        const numDepartments = faker.number.int({ min: 4, max: 8 });
        const departmentIds: string[] = [];

        for (let i = 0; i < numDepartments; i++) {
            const name = faker.commerce.department();
            const code = `${name.slice(0, 3).toUpperCase()}-${faker.number.int({ min: 10, max: 99 })}`;

            const department = await prisma.department.create({
                data: {
                    name: `${name} ${faker.string.alphanumeric(3).toUpperCase()}`,
                    code,
                    description: faker.company.catchPhrase(),
                    companyId: company.id,
                    tenantId: tenant.id,
                },
            });

            departmentIds.push(department.id);
            departmentCount++;
        }

        departmentsByCompany.set(company.id, departmentIds);
    }
    // 8.1 Create Policy Types
    console.log('Creating Policy Types...');
    const policyTypesData = [
        { name: 'Tamamlayıcı Sağlık', slug: 'tss', color: '#10b981', icon: 'pi pi-heart', description: 'SGK anlaşmalı hastanelerde geçerli.' },
        { name: 'Özel Sağlık', slug: 'oss', color: '#3b82f6', icon: 'pi pi-shield', description: 'Kapsamlı özel sağlık sigortası.' },
        { name: 'Hayat Sigortası', slug: 'life', color: '#f59e0b', icon: 'pi pi-user', description: 'Vefat ve maluliyet teminatı.' },
        { name: 'Ferdi Kaza', slug: 'ferdi', color: '#ef4444', icon: 'pi pi-bolt', description: 'Kaza sonucu tedavi ve tazminat.' },
    ];

    const policyTypes: any[] = [];
    for (const pt of policyTypesData) {
        const created = await prisma.policyType.create({
            data: {
                ...pt,
                isActive: true,
                tenantId: tenant.id,
            }
        });
        policyTypes.push(created);
    }
    console.log(`✨ Created ${policyTypes.length} policy types`);

    // 9. Create Employees and Policies
    let employeeCount = 0;
    let policyCount = 0;

    for (const company of companies) {
        // 20-50 employees per company
        const numEmployees = faker.number.int({ min: 20, max: 50 });

        for (let j = 0; j < numEmployees; j++) {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const departmentIds = departmentsByCompany.get(company.id) || [];
            const departmentId = departmentIds.length
                ? departmentIds[faker.number.int({ min: 0, max: departmentIds.length - 1 })]
                : undefined;

            const employee = await prisma.employee.create({
                data: {
                    firstName,
                    lastName,
                    tcNo: faker.number.int({ min: 10000000000, max: 99999999999 }).toString(),
                    email: faker.internet.email({ firstName, lastName }),
                    phoneNumber: faker.phone.number(),
                    birthDate: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }),
                    departmentId,
                    avatarUrl: faker.image.avatar(),
                    companyId: company.id,
                    tenantId: tenant.id,
                },
            });
            employeeCount++;

            // 60% chance of having a policy
            if (faker.datatype.boolean(0.6)) {
                const startDate = faker.date.past();
                const endDate = faker.date.future();
                const randomType = faker.helpers.arrayElement(policyTypes);

                // Map slug to Enum for backward compatibility
                let typeEnum: PolicyTypeEnum = PolicyTypeEnum.TSS;
                if (randomType.slug === 'oss') typeEnum = PolicyTypeEnum.OSS;
                if (randomType.slug === 'life') typeEnum = PolicyTypeEnum.LIFE;
                if (randomType.slug === 'ferdi') typeEnum = PolicyTypeEnum.FERDI_KAZA;

                const policy = await prisma.policy.create({
                    data: {
                        policyNo: faker.string.alphanumeric(10).toUpperCase(),
                        type: typeEnum,
                        policyTypeId: randomType.id,
                        status: PolicyStatus.ACTIVE,
                        startDate,
                        endDate,
                        premium: faker.number.float({ min: 1000, max: 50000, fractionDigits: 2 }),
                        currency: 'TRY',
                        tenantId: tenant.id,
                        employeeId: employee.id,
                        companyId: company.id,
                        autoRenew: faker.datatype.boolean(),
                        packageName: `${faker.word.adjective()} Paketi`,
                    }
                });

                // Create Installments (Payments)
                const installmentCount = faker.helpers.arrayElement([1, 6, 12]);
                const amountPerInstallment = Number(policy.premium) / installmentCount;

                for (let k = 1; k <= installmentCount; k++) {
                    const dueDate = new Date(startDate);
                    dueDate.setMonth(dueDate.getMonth() + (k - 1));

                    const isPaid = faker.datatype.boolean(0.7); // 70% paid
                    let status = 'PENDING';

                    // Simple logic: if paid, set paidDate. If not paid and past due, OVERDUE.
                    let paidDate: Date | null = null;
                    if (isPaid) {
                        status = 'PAID';
                        // Paid roughly around due date, but not in future relative to real time
                        const now = new Date();
                        paidDate = new Date(dueDate);
                        if (paidDate > now) paidDate = now;
                    } else if (dueDate < new Date()) {
                        status = 'OVERDUE';
                    }

                    await prisma.policyPayment.create({
                        data: {
                            policyId: policy.id,
                            installmentNo: k,
                            amount: amountPerInstallment,
                            dueDate,
                            status: status as any, // Cast to enum if imported
                            paidDate,
                        }
                    });
                }

                policyCount++;
            }
        }
    }

    console.log(`🧑‍💼 Created ${employeeCount} employees`);
    console.log(`📜 Created ${policyCount} policies`);
    // 10. Create Seed Activities
    console.log('📜 Generating activity logs...');
    const activityTypes = [
        'COMPANY_CREATED', 'COMPANY_UPDATED', 'EMPLOYEE_CREATED', 'POLICY_CREATED', 'POLICY_UPDATED'
    ];

    for (let i = 0; i < 20; i++) {
        const type = faker.helpers.arrayElement(activityTypes);
        let title = '';
        let description = '';

        switch (type) {
            case 'COMPANY_CREATED':
                title = 'Yeni şirket eklendi';
                description = `${faker.company.name()} sisteme kaydedildi.`;
                break;
            case 'COMPANY_UPDATED':
                title = 'Şirket güncellendi';
                description = `${faker.company.name()} bilgileri düzenlendi.`;
                break;
            case 'EMPLOYEE_CREATED':
                title = 'Yeni çalışan girişi';
                description = `${faker.person.fullName()} şirkete eklendi.`;
                break;
            case 'POLICY_CREATED':
                title = 'Poliçe oluşturuldu';
                description = 'Yeni sağlık sigortası poliçesi tanımlandı.';
                break;
            case 'POLICY_UPDATED':
                title = 'Poliçe yenilendi';
                description = 'TSS poliçesi için yenileme teklifi onaylandı.';
                break;
        }

        await prisma.activity.create({
            data: {
                type: type as any,
                title,
                description,
                tenantId: tenant.id,
                createdAt: faker.date.recent({ days: 7 }), // Activity within last 7 days
            }
        });
    }
    console.log('✅ Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
